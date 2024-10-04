"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";
import Konva from "konva";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import FontFaceObserver from "fontfaceobserver";

import { generateUploadS3PresignedUrl } from "@/lib/s3";
import { toast } from "sonner";
import { ulid } from "ulid";
import { addGenerateMeme } from "../_lib/actions";
import { getEnumFromImagePath } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import SignInDialog from "@/components/sign-in-dialog";
import {
  creepster,
  customFonts,
  fontOptions,
  ImageDimensions,
  sampleImages,
  TextElement,
} from "../_lib/types";

export default function MemeGenerator() {
  const [selectedImage, setSelectedImage] = useState(sampleImages[0]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const user = useUser();

  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({
    width: 500,
    height: 500,
  });

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    // Load custom fonts
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Creepster&family=Bangers&family=Permanent+Marker&family=Abril+Fatface&family=Lobster&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    Promise.all(customFonts.map((font) => new FontFaceObserver(font).load()))
      .then(() => {
        setFontsLoaded(true);
      })
      .catch((err) => {
        console.error("Some fonts were not loaded", err);
      });
  }, []);

  const handleImageSelect = (img: string) => {
    setSelectedImage(img);
    const image = new window.Image();
    image.src = img;
    image.onload = () => {
      setImage(image);
      const maxWidth = 500;
      const scaleFactor = image.width > maxWidth ? maxWidth / image.width : 1;
      setImageDimensions({
        width: image.width * scaleFactor,
        height: image.height * scaleFactor,
      });
    };
  };

  const addNewText = () => {
    if (!user.isSignedIn) {
      return setAuthOpen(true);
    }
    const newText: TextElement = {
      id: Date.now().toString(),
      text: "New Text",
      fontFamily: fontOptions[1],
      fontSize: 32,
      position: { x: imageDimensions.width / 2, y: imageDimensions.height / 2 },
      color: "#ffffff",
      bold: false,
      strokeWidth: 1,
    };
    setTextElements([...textElements, newText]);
    setSelectedTextId(newText.id);
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(
      textElements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteTextElement = (id: string) => {
    setTextElements(textElements.filter((el) => el.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  const handleTextDragEnd = (
    id: string,
    e: Konva.KonvaEventObject<DragEvent>
  ) => {
    updateTextElement(id, { position: { x: e.target.x(), y: e.target.y() } });
  };

  const generateMeme = async () => {
    if (!user.isSignedIn) {
      return setAuthOpen(true);
    }
    if (textElements.length === 0) {
      return toast.error("Please add some text to the meme");
    }
    if (stageRef.current) {
      setIsUploading(true);
      try {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });

        const compressedDataURL = await compressImage(dataURL, 500 * 1024);
        const res = await fetch(compressedDataURL);

        const blob = await res.blob();

        const fileName = `${ulid()}_meme.png`;
        const { key, url } = await generateUploadS3PresignedUrl({
          key: fileName,
          bucket: "mastika-meme",
          domain: "memes",
        });

        const uploadRes = await fetch(url, {
          method: "PUT",
          body: blob,
          headers: {
            "Content-Type": "image/png",
          },
        });

        if (!uploadRes.ok) {
          return toast.error("Error uploading meme to S3");
        }

        const dbRes = await addGenerateMeme({
          name: fileName,
          template: getEnumFromImagePath(selectedImage) ?? "MASTIKA_1",
          filePath: key,
        });

        if (dbRes.error) {
          return toast.error(dbRes.error);
        }

        const link = document.createElement("a");
        link.download = `${ulid()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.log("Error generating or uploading meme:", error);
        toast.error("Error generating or uploading meme");
      } finally {
        toast.success("Mastika meme generated!");
        setIsUploading(false);
      }
    }
  };

  const compressImage = (
    dataURL: string,
    targetSizeInBytes: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let quality = 0.8;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Set initial canvas size
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200; // Adjust this value as needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;

        const compress = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataURL = canvas.toDataURL("image/jpeg", quality);
          const size = atob(compressedDataURL.split(",")[1]).length;

          if (size > targetSizeInBytes && quality > 0.1) {
            quality -= 0.05;
            compress();
          } else {
            resolve(compressedDataURL);
          }
        };

        compress();
      };
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      img.src = dataURL;
    });
  };

  const selectedText = textElements.find((el) => el.id === selectedTextId);

  return (
    <>
      <SignInDialog open={authOpen} setOpen={() => setAuthOpen(false)} />
      <div className="flex h-screen bg-black">

        <div>
        tes
        </div>
      </div>
    </>
  );
}
