import { Creepster } from "next/font/google";

export const creepster = Creepster({
  display: "swap",
  weight: "400",
  subsets: ["latin"],
});

interface Position {
  x: number;
  y: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface TextElement {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  position: Position;
  color: string;
  bold: boolean;
  strokeWidth: number;
}

export const sampleImages = [
  "/meme/mastika-1.jpg",
  "/meme/mastika-2.jpg",
  "/meme/mastika-3.jpg",
  "/meme/mastika-4.jpg",
];

export const fontOptions = [
  "Comic Sans MS",
  "Creepster",
  "Bangers",
  "Permanent Marker",
  "Abril Fatface",
  "Lobster",
];

export const customFonts = [
  "Creepster",
  "Bangers",
  "Permanent Marker",
  "Abril Fatface",
  "Lobster",
];
