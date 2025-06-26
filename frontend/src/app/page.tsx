"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Download, Sparkles } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import DraggableOverlay from "@/components/DraggableOverlay";
import ResultViewer from "@/components/ResultViewer";
import { loadImage } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
}

export default function ImageComposer() {
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [itemImage, setItemImage] = useState<HTMLImageElement | null>(null);
  const [itemPosition, setItemPosition] = useState<Position>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [composedImage, setComposedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(
    null
  ) as React.RefObject<HTMLCanvasElement>;
  const composedCanvasRef = useRef<HTMLCanvasElement>(
    null
  ) as React.RefObject<HTMLCanvasElement>;
  const baseFileRef = useRef<HTMLInputElement>(
    null
  ) as React.RefObject<HTMLInputElement>;
  const itemFileRef = useRef<HTMLInputElement>(
    null
  ) as React.RefObject<HTMLInputElement>;

  const ITEM_SIZE = 100; // 固定サイズ

  const handleBaseImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const img = await loadImage(file);
        setBaseImage(img);
        setComposedImage(null);
      } catch (error) {
        console.error("Failed to load base image:", error);
      }
    }
  };

  const handleItemImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const img = await loadImage(file);
        setItemImage(img);
        setComposedImage(null);
      } catch (error) {
        console.error("Failed to load item image:", error);
      }
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // キャンバスサイズを調整
    const maxWidth = 600;
    const maxHeight = 400;
    let { width, height } = baseImage;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }

    canvas.width = width;
    canvas.height = height;

    // 背景画像を描画
    ctx.drawImage(baseImage, 0, 0, width, height);

    // アイテム画像を描画する部分を枠線の描画に変更
    if (itemImage) {
      // 枠線を描画（NFTスタイルのネオンカラー）
      ctx.strokeStyle = "#00ff88"; // ネオングリーン
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]); // 破線スタイル
      ctx.strokeRect(itemPosition.x, itemPosition.y, ITEM_SIZE, ITEM_SIZE);

      // 中央に十字線を描画
      ctx.setLineDash([]); // 実線に戻す
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ff0080"; // ネオンピンク
      ctx.beginPath();
      // 水平線
      ctx.moveTo(itemPosition.x, itemPosition.y + ITEM_SIZE / 2);
      ctx.lineTo(itemPosition.x + ITEM_SIZE, itemPosition.y + ITEM_SIZE / 2);
      // 垂直線
      ctx.moveTo(itemPosition.x + ITEM_SIZE / 2, itemPosition.y);
      ctx.lineTo(itemPosition.x + ITEM_SIZE / 2, itemPosition.y + ITEM_SIZE);
      ctx.stroke();

      // 角にサイズ表示（ネオンスタイル）
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillText(
        `${ITEM_SIZE}×${ITEM_SIZE}`,
        itemPosition.x + 2,
        itemPosition.y - 8
      );
    }
  }, [baseImage, itemImage, itemPosition]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!itemImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // アイテム画像の範囲内かチェック
    if (
      x >= itemPosition.x &&
      x <= itemPosition.x + ITEM_SIZE &&
      y >= itemPosition.y &&
      y <= itemPosition.y + ITEM_SIZE
    ) {
      setIsDragging(true);
      setDragOffset({
        x: x - itemPosition.x,
        y: y - itemPosition.y,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!itemImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault(); // スクロールを防ぐ
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // アイテム画像の範囲内かチェック
    if (
      x >= itemPosition.x &&
      x <= itemPosition.x + ITEM_SIZE &&
      y >= itemPosition.y &&
      y <= itemPosition.y + ITEM_SIZE
    ) {
      setIsDragging(true);
      setDragOffset({
        x: x - itemPosition.x,
        y: y - itemPosition.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !itemImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault(); // スクロールを防ぐ
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left - dragOffset.x;
    const y = touch.clientY - rect.top - dragOffset.y;

    // キャンバス内に制限
    const maxX = canvas.width - ITEM_SIZE;
    const maxY = canvas.height - ITEM_SIZE;

    setItemPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !itemImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // キャンバス内に制限
    const maxX = canvas.width - ITEM_SIZE;
    const maxY = canvas.height - ITEM_SIZE;

    setItemPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const composeImages = async () => {
    const canvas = composedCanvasRef.current;
    if (!canvas || !baseImage) return;

    // 既存の合成画像を非表示にする
    setComposedImage(null);
    setIsGenerating(true);

    try {
      // AIバックエンド処理をシミュレート（1秒待機）
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 元の画像サイズで合成
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      // 背景画像を描画
      ctx.drawImage(baseImage, 0, 0);

      // アイテム画像を描画（スケール調整）- 合成時は実際の画像を使用
      if (itemImage) {
        const displayCanvas = canvasRef.current;
        if (displayCanvas) {
          const scaleX = baseImage.width / displayCanvas.width;
          const scaleY = baseImage.height / displayCanvas.height;

          ctx.drawImage(
            itemImage,
            itemPosition.x * scaleX,
            itemPosition.y * scaleY,
            ITEM_SIZE * scaleX,
            ITEM_SIZE * scaleY
          );
        }
      }

      // 合成画像をデータURLとして保存
      const dataURL = canvas.toDataURL("image/png");
      setComposedImage(dataURL);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadComposedImage = () => {
    if (!composedImage) return;

    const link = document.createElement("a");
    link.download = "azuki-generated.png";
    link.href = composedImage;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Azuki Generator
            </h1>
            <Sparkles className="w-8 h-8 text-pink-400" />
          </div>
          <p className="text-slate-300 text-lg">
            Create unique NFT compositions with ease
          </p>
        </div>

        {/* 画像アップロードUI */}
        <ImageUploader
          baseFileRef={baseFileRef}
          itemFileRef={itemFileRef}
          handleBaseImageUpload={handleBaseImageUpload}
          handleItemImageUpload={handleItemImageUpload}
          baseImage={baseImage}
          itemImage={itemImage}
          ITEM_SIZE={ITEM_SIZE}
        />

        {/* プレビュー（ドラッグ可能なオーバーレイ） */}
        {baseImage && (
          <Card className="mb-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Composition Studio
              </CardTitle>
              <p className="text-slate-400">
                {itemImage
                  ? "Drag the neon frame to position your item"
                  : "Upload an item image to start composing"}
              </p>
            </CardHeader>
            <CardContent>
              <DraggableOverlay
                baseImage={baseImage}
                itemImage={itemImage}
                itemPosition={itemPosition}
                isDragging={isDragging}
                canvasRef={canvasRef}
                handleMouseDown={handleMouseDown}
                handleMouseMove={handleMouseMove}
                handleMouseUp={handleMouseUp}
                handleMouseLeave={handleMouseUp}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
              />
              <div className="flex justify-center">
                <Button
                  onClick={composeImages}
                  disabled={!baseImage || !itemImage || isGenerating}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 px-8 py-3 text-lg font-semibold disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate NFT
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 合成画像の表示 */}
        <ResultViewer
          composedImage={composedImage}
          onDownload={downloadComposedImage}
        />

        {/* 非表示の合成用キャンバス */}
        <canvas ref={composedCanvasRef} className="hidden" />
      </div>
    </div>
  );
}
