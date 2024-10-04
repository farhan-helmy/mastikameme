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
        {/* Left Sidebar - Image Selection */}
        <Card className="w-56 h-full rounded-none border-r overflow-auto">
          <CardContent className="p-4">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <h2 className={`text-xl font-bold mb-4 ${creepster.className}`}>
              Select Image
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {sampleImages.map((img, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={index}
                  src={img}
                  alt={`Meme template ${index + 1}`}
                  className={`w-full h-auto cursor-pointer border-2 rounded-md transition-all ${
                    selectedImage === img
                      ? "border-primary"
                      : "border-transparent hover:border-primary/50"
                  }`}
                  onClick={() => handleImageSelect(img)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Meme Preview */}
        <div className="flex-1 p-8 flex flex-col items-center">
          <h1
            className={`text-2xl font-bold text-red-600 ${creepster.className}`}
          >
            Mastika Meme Generator
          </h1>
          <Link href="/memes">
            <Button
              variant="link"
              className={`mb-4 ${creepster.className} text-white`}
            >
              View all Mastika Memes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          {image && (
            <>
              <Stage
                width={imageDimensions.width}
                height={imageDimensions.height}
                ref={stageRef}
              >
                <Layer>
                  <KonvaImage
                    image={image}
                    src={selectedImage}
                    width={imageDimensions.width}
                    height={imageDimensions.height}
                  />
                  {textElements.map((el) => (
                    <Text
                      key={el.id}
                      text={el.text}
                      fontSize={el.fontSize}
                      fontFamily={fontsLoaded ? el.fontFamily : "Arial"}
                      fill={el.color}
                      stroke="black"
                      strokeWidth={el.strokeWidth}
                      draggable
                      x={el.position.x}
                      y={el.position.y}
                      onDragEnd={(e) => handleTextDragEnd(el.id, e)}
                      onClick={() => setSelectedTextId(el.id)}
                      fontStyle={el.bold ? "bold" : "normal"}
                    />
                  ))}
                </Layer>
              </Stage>
              <Button
                onClick={generateMeme}
                variant={"outline"}
                className={`mt-4 font-creepster ${creepster.className}`}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Generate Meme"}
              </Button>
            </>
          )}
        </div>

        {/* Right Sidebar - Text Controls */}
        <Card className="w-1/4 h-full rounded-none border-l">
          <CardContent className="p-6 space-y-6">
            <Button onClick={addNewText} className="w-full">
              Add New Text
            </Button>

            {selectedText && (
              <>
                <div className="italic font-light text-sm">
                  * Click add new text to add more text
                  <br />* The text is on top of each other, click and drag on
                  the text to select and edit it
                </div>
                <div className="italic font-light text-sm"></div>
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text Content</Label>
                  <Input
                    id="text-input"
                    value={selectedText.text}
                    onChange={(e) =>
                      updateTextElement(selectedText.id, {
                        text: e.target.value,
                      })
                    }
                    placeholder="Enter your meme text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-select">Font</Label>
                  <Select
                    value={selectedText.fontFamily}
                    onValueChange={(value) =>
                      updateTextElement(selectedText.id, { fontFamily: value })
                    }
                  >
                    <SelectTrigger id="font-select">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">
                    Font Size: {selectedText.fontSize}px
                  </Label>
                  <Slider
                    id="font-size"
                    min={24}
                    max={128}
                    step={1}
                    value={[selectedText.fontSize]}
                    onValueChange={(value) =>
                      updateTextElement(selectedText.id, { fontSize: value[0] })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-size">
                    Stroke Width: {selectedText.strokeWidth}px
                  </Label>
                  <Slider
                    id="stroke-width"
                    min={1}
                    max={6}
                    step={1}
                    value={[selectedText.strokeWidth]}
                    onValueChange={(value) =>
                      updateTextElement(selectedText.id, {
                        strokeWidth: value[0],
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-color">Font Color</Label>
                  <Input
                    id="font-color"
                    type="color"
                    value={selectedText.color}
                    onChange={(e) =>
                      updateTextElement(selectedText.id, {
                        color: e.target.value,
                      })
                    }
                    className="h-10 p-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="bold-toggle"
                    checked={selectedText.bold}
                    onCheckedChange={(checked) =>
                      updateTextElement(selectedText.id, { bold: checked })
                    }
                  />
                  <Label htmlFor="bold-toggle">Bold</Label>
                </div>

                <Button
                  onClick={() => deleteTextElement(selectedText.id)}
                  variant="destructive"
                  className="w-full"
                >
                  Delete Text
                </Button>

                <div className="font-light italic text-sm">
                  * Click on the text in the meme to select and edit it
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
