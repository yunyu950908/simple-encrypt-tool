"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, AlertCircle } from "lucide-react";
import {
  encryptAES,
  decryptAES,
  EncryptAlgorithm,
  DeriveAlgorithm,
} from "@/lib/crypto";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { bs58 } from "@/lib/basex";
import * as uuid from "uuid";

enum Mode {
  Encrypt = "encrypt",
  Decrypt = "decrypt",
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

  const [deriveKey, setDeriveKey] = useState("");
  const [deriveAlgorithm, setDeriveAlgorithm] = useState(
    DeriveAlgorithm.PBKDF2
  );
  const [useRandomDeriveKey, setUseRandomDeriveKey] = useState(true);
  const [encryptKey, setEncryptKey] = useState("");
  const [encryptAlgorithm, setEncryptAlgorithm] = useState(
    EncryptAlgorithm.AES_GCM
  );
  const [mode, setMode] = useState(Mode.Encrypt);
  const [copied, setCopied] = useState(false);

  const clean = () => {
    setInputText("");
    setOutputText("");
    setEncryptKey("");
    setDeriveKey("");
    setEncryptAlgorithm(EncryptAlgorithm.AES_GCM);
    setDeriveAlgorithm(DeriveAlgorithm.PBKDF2);
  };

  const handleProcess = async () => {
    if (!inputText || !encryptKey) return;

    try {
      switch (mode) {
        case Mode.Encrypt:
          const encrypted = await encryptAES({
            text: inputText,
            encryptAlgorithm,
            deriveAlgorithm,
            encryptKey,
            deriveKey: !!deriveKey.trim() ? deriveKey : uuid.v4(),
          });
          setOutputText(bs58.encode(new Uint8Array(encrypted.encrypted)));
          setDeriveKey(encrypted.salt);
          break;
        case Mode.Decrypt:
          const decrypted = await decryptAES({
            encrypted: bs58.decode(inputText).buffer as ArrayBuffer,
            encryptKey,
            deriveKey,
            encryptAlgorithm,
            deriveAlgorithm,
          });
          setOutputText(decrypted.decrypted);
          break;
        default:
          throw new Error("Invalid mode");
      }
    } catch (error) {
      console.error("Processing error:", error);
      setOutputText(
        "Error: " + (error instanceof Error ? error.message : String(error))
      );
    }
  };

  const copyToClipboard = () => {
    const textToCopy = mode === Mode.Encrypt ? outputText : inputText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // // 将助记词格式化为带编号的形式
  // const formatMnemonic = (mnemonic: string) => {
  //   if (!mnemonic) return null;

  //   const words = mnemonic.split(" ");
  //   console.log(`Formatting ${words.length} words`); // 添加日志以检查词数

  //   return (
  //     <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
  //       {words.map((word, index) => (
  //         <div
  //           key={index}
  //           className="flex items-center p-2 border rounded-md bg-muted/30"
  //         >
  //           <span className="mr-2 text-xs text-muted-foreground">
  //             {index + 1}.
  //           </span>
  //           <span>{word}</span>
  //         </div>
  //       ))}
  //     </div>
  //   );
  // };

  return (
    <main className="container mx-auto py-10 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">字符串加密解密工具</CardTitle>
          <CardDescription>
            提供多种对称加密算法，安全地加密和解密您的文本
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={Mode.Encrypt}
            onValueChange={(value) => {
              setMode(value as Mode);
              setOutputText("");
              setInputText("");
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value={Mode.Encrypt} onClick={clean}>
                加密
              </TabsTrigger>
              <TabsTrigger value={Mode.Decrypt} onClick={clean}>
                解密
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <div>
                <Label htmlFor="derive-algorithm">密钥派生函数</Label>
                <Select
                  value={deriveAlgorithm}
                  onValueChange={(value) =>
                    setDeriveAlgorithm(value as DeriveAlgorithm)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择密钥派生函数" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DeriveAlgorithm).map(([key, value]) => (
                      <SelectItem
                        key={key}
                        value={value}
                        disabled={value === DeriveAlgorithm.Argon2}
                      >
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="encrypt-algorithm">加密算法</Label>
                <Select
                  value={encryptAlgorithm}
                  onValueChange={(value) =>
                    setEncryptAlgorithm(value as EncryptAlgorithm)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择加密算法" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EncryptAlgorithm).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* {mode === Mode.Encrypt && (
                <div>
                  <Label htmlFor="wordCount">助记词长度</Label>
                  <Select value={wordCount} onValueChange={setWordCount}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择助记词长度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 个词 (标准)</SelectItem>
                      <SelectItem value="18">18 个词 (增强)</SelectItem>
                      <SelectItem value="24">24 个词 (最高安全)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )} */}

              {mode === Mode.Encrypt && (
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="useRandomDeriveKey"
                    checked={useRandomDeriveKey}
                    onCheckedChange={(checked) =>
                      setUseRandomDeriveKey(!!checked)
                    }
                  />
                  <Label
                    htmlFor="useRandomDeriveKey"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    使用随机盐（增强安全性）
                  </Label>
                </div>
              )}

              <div>
                <Label htmlFor="deriveKey">加密盐</Label>
                <Input
                  disabled={mode === Mode.Encrypt && useRandomDeriveKey}
                  id="deriveKey"
                  type="password"
                  placeholder="输入加密盐"
                  value={deriveKey}
                  onChange={(e) => setDeriveKey(e.target.value.trim())}
                />
              </div>

              <div>
                <Label htmlFor="encryptKey">密钥</Label>
                <Input
                  id="encryptKey"
                  type="password"
                  placeholder="输入密钥"
                  value={encryptKey}
                  onChange={(e) => setEncryptKey(e.target.value.trim())}
                />
              </div>

              {mode === "encrypt" ? (
                <div>
                  <Label htmlFor="input">要加密的文本</Label>
                  <Textarea
                    id="input"
                    placeholder="输入要加密的文本"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={4}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="input">密文内容</Label>
                    <Textarea
                      id="input"
                      placeholder="输入密文内容"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value.trim())}
                      rows={4}
                    />
                  </div>
                </>
              )}

              <Button onClick={handleProcess} className="w-full">
                {mode === Mode.Encrypt ? "加密" : "解密"}
              </Button>

              {mode === Mode.Encrypt && outputText && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>加密结果</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copied ? "已复制" : "复制"}
                    </Button>
                  </div>

                  {/* <div className="p-4 border rounded-md bg-muted/20">
                    {formatMnemonic(mnemonic)}
                  </div> */}
                  <div>
                    <Textarea
                      id="output"
                      value={outputText}
                      readOnly
                      rows={4}
                    />
                  </div>

                  {useRandomDeriveKey && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>重要提示</AlertTitle>
                      <AlertDescription>
                        请保存以下随机盐，解密时需要使用：
                        <br />
                        <code className="bg-muted p-1 rounded">
                          {deriveKey}
                        </code>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {mode === Mode.Decrypt && outputText && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="output">解密结果</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copied ? "已复制" : "复制"}
                    </Button>
                  </div>
                  <Textarea id="output" value={outputText} readOnly rows={4} />
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <p>
            支持 AES 和 Triple DES 等加密算法，结果以 Base58 编码的文本形式呈现
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
