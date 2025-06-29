"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepResults, setStepResults] = useState<Record<number, any>>({});

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

  const callAPIStep = async (step: number) => {
    if (!baseImage || !itemImage) return;

    setIsGenerating(true);

    try {
      // バックエンドのURL
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
      
      // base image
      const baseCanvas = document.createElement("canvas");
      const baseCtx = baseCanvas.getContext("2d");
      if (!baseCtx) throw new Error("Could not get canvas context");

      baseCanvas.width = baseImage.width;
      baseCanvas.height = baseImage.height;
      baseCtx.drawImage(baseImage, 0, 0);
      const baseImageData = baseCanvas.toDataURL("image/png").split(",")[1];

      // item image
      const itemCanvas = document.createElement("canvas");
      const itemCtx = itemCanvas.getContext("2d");
      if (!itemCtx) throw new Error("Could not get canvas context");

      itemCanvas.width = itemImage.width;
      itemCanvas.height = itemImage.height;
      itemCtx.drawImage(itemImage, 0, 0);
      const itemImageData = itemCanvas.toDataURL("image/png").split(",")[1];

      // scale calculation
      const displayCanvas = canvasRef.current;
      if (!displayCanvas) throw new Error("Display canvas not found");
      const scaleX = baseImage.width / displayCanvas.width;
      const scaleY = baseImage.height / displayCanvas.height;

      let endpoint = "";
      let requestBody: any = {};

      switch (step) {
        case 1:
          endpoint = "/api/analyze-item-image";
          requestBody = {
            item_image: itemImageData,
          };
          break;
        case 2:
          endpoint = "/api/generate-prompt";
          requestBody = {
            "image-info": stepResults[1],
          };
          break;
        case 3:
          endpoint = "/api/generate-mask-image";
          requestBody = {
            item_image: itemImageData,
            missing_part: stepResults[1]?.missing_part,
          };
          break;
        case 4:
          endpoint = "/api/generate-item-image";
          requestBody = {
            base_image: itemImageData,
            mask_image: stepResults[3]?.mask_image,
            prompt: stepResults[2]?.prompt,
          };
          break;
        case 5:
          endpoint = "/api/remove-background";
          requestBody = {
            image: stepResults[4]?.generated_image,
          };
          break;
        case 6:
          endpoint = "/api/generate";
          requestBody = {
            base_image: baseImageData,
            item_image: stepResults[5]?.transparent_image,
            position: {
              x: Math.round(itemPosition.x * scaleX),
              y: Math.round(itemPosition.y * scaleY),
            },
          };
          break;
      }

      console.log(`Step ${step} - Calling ${endpoint}:`, requestBody);

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Backend API error: ${error}`);
      }

      // 画像を返すAPIの場合はBase64に変換
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('image/')) {
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        
        // APIのエンドポイントに応じて適切なキー名で保存
        if (endpoint.includes('mask')) data = { mask_image: base64 };
        else if (endpoint.includes('item-image')) data = { generated_image: base64 };
        else if (endpoint.includes('background')) data = { transparent_image: base64 };
      } else {
        // JSONレスポンスの場合
        data = await response.json();
      }

      console.log(`Step ${step} レスポンス:`, data);

      // 各ステップの結果を保存
      setStepResults(prev => ({
        ...prev,
        [step]: data,
      }));

      // Step 6の場合は最終画像を設定
      if (step === 6) {
        setComposedImage(data.result_image);
      }

    } catch (error) {
      console.error(`Step ${step} Error:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Step ${step} の処理に失敗しました: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadComposedImage = async () => {
    if (!composedImage) return;

    try {
      if (composedImage.startsWith("data:")) {
        // Data URLの場合は直接ダウンロード
        const link = document.createElement("a");
        link.download = "azuki-generated.png";
        link.href = composedImage;
        link.click();
      } else {
        // GCS URLから画像をフェッチ
        const response = await fetch(composedImage);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.download = "azuki-generated.png";
        link.href = url;
        link.click();

        // クリーンアップ
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download error:", error);
      // フォールバック: 直接URLを開く
      window.open(composedImage, "_blank");
    }
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
              
              {/* Processing Controls */}
              <div className="space-y-4 mt-6">
                {/* ステップボタン */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <Button
                      key={step}
                      onClick={() => callAPIStep(step)}
                      disabled={!baseImage || !itemImage || isGenerating || (step > 1 && !stepResults[step - 1])}
                      size="sm"
                      variant={stepResults[step] ? "default" : "outline"}
                      className={`text-sm ${
                        stepResults[step] 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
                      }`}
                    >
                      {isGenerating && currentStep === step ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      ) : stepResults[step] ? (
                        "✓"
                      ) : null}
                      Step {step}
                    </Button>
                  ))}
                </div>

                {/* ステップ結果表示 */}
                {Object.keys(stepResults).length > 0 && (
                  <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="text-purple-400 font-semibold mb-2">処理結果:</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(stepResults).map(([step, result]) => (
                        <div key={step} className="text-slate-300">
                          <span className="text-green-400">Step {step}:</span> {
                            step === "1" ? `${result.species} (${result.color}) - ${result.missing_part}` :
                            step === "2" ? `プロンプト生成完了: ${result.prompt?.substring(0, 50)}...` :
                            step === "3" ? "マスク画像生成完了" :
                            step === "4" ? "DALL-E画像生成完了" :
                            step === "5" ? "背景除去完了" :
                            step === "6" ? "最終合成完了" : "完了"
                          }
                          {/* 画像プレビュー（開発環境のみ） */}
                          {process.env.NODE_ENV === "development" && (
                            <>
                              {step === "3" && result.mask_image && (
                                <div className="mt-2">
                                  <a 
                                    href={`data:image/png;base64,${result.mask_image}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline text-xs"
                                  >
                                    マスク画像を確認 →
                                  </a>
                                </div>
                              )}
                              {step === "4" && result.generated_image && (
                                <div className="mt-2">
                                  <a 
                                    href={`data:image/png;base64,${result.generated_image}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline text-xs"
                                  >
                                    DALL-E生成画像を確認 →
                                  </a>
                                </div>
                              )}
                              {step === "5" && result.transparent_image && (
                                <div className="mt-2">
                                  <a 
                                    href={`data:image/png;base64,${result.transparent_image}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline text-xs"
                                  >
                                    背景除去画像を確認 →
                                  </a>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={async () => {
                      for (let step = 1; step <= 6; step++) {
                        if (!stepResults[step]) {
                          setCurrentStep(step);
                          await callAPIStep(step);
                        }
                      }
                    }}
                    disabled={!baseImage || !itemImage || isGenerating}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 px-8 py-3 text-lg font-semibold disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Step {currentStep} 実行中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        全ステップ実行
                      </>
                    )}
                  </Button>
                </div>
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