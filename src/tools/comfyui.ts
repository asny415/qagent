import { comfyui, loadUrl } from "../ElectronWindow";
import { DOC, getRandomInt, TOOL_FUNCTION } from "./common";

export const flux_doc: DOC = [
  "使用flux模型进行文生图",
  [
    ["width", "int", "width of image"],
    ["height", "int", "height of image"],
    ["prompt", "string", "prompt to generate image, only support english"],
  ],
];

export const flux: TOOL_FUNCTION = async (args, cb) => {
  const { prompt, width, height } = args;
  const _prompt = {
    "3": {
      inputs: {
        seed: getRandomInt(1000, 10000000000),
        steps: 25,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 0.9600000000000002,
        model: ["10", 0],
        positive: ["19", 0],
        negative: ["7", 0],
        latent_image: ["5", 0],
      },
      class_type: "KSampler",
      _meta: {
        title: "K采样器",
      },
    },
    "5": {
      inputs: {
        width,
        height,
        batch_size: 1,
      },
      class_type: "EmptyLatentImage",
      _meta: {
        title: "空Latent图像",
      },
    },
    "6": {
      inputs: {
        text: prompt,
        clip: ["18", 0],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP文本编码",
      },
    },
    "7": {
      inputs: {
        text: "(ugly, deformed, mutated, disfigured:1.3), (realistic humans, people:1.2), (simple background, plain background:1.0), (low quality, \nblurry, pixelated:1.3), (text, watermark, signature:1.2), (cartoon, anime:1.0)",
        clip: ["18", 0],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP文本编码",
      },
    },
    "8": {
      inputs: {
        samples: ["3", 0],
        vae: ["11", 0],
      },
      class_type: "VAEDecode",
      _meta: {
        title: "VAE解码",
      },
    },
    "10": {
      inputs: {
        unet_name: "Flux1-Dev-DedistilledMixTuned-v3-Q8_0.gguf",
      },
      class_type: "UnetLoaderGGUF",
      _meta: {
        title: "Unet Loader (GGUF)",
      },
    },
    "11": {
      inputs: {
        vae_name: "ae.safetensors",
      },
      class_type: "VAELoader",
      _meta: {
        title: "加载VAE",
      },
    },
    "14": {
      inputs: {
        images: ["20", 0],
      },
      class_type: "PreviewImage",
      _meta: {
        title: "预览图像",
      },
    },
    "18": {
      inputs: {
        clip_name1: "t5/t5xxl_fp8_e4m3fn.safetensors",
        clip_name2: "clip_l.safetensors",
        type: "flux",
        device: "default",
      },
      class_type: "DualCLIPLoader",
      _meta: {
        title: "双CLIP加载器",
      },
    },
    "19": {
      inputs: {
        value: ["6", 0],
      },
      class_type: "UnloadAllModels",
      _meta: {
        title: "UnloadAllModels",
      },
    },
    "20": {
      inputs: {
        value: ["8", 0],
      },
      class_type: "UnloadAllModels",
      _meta: {
        title: "UnloadAllModels",
      },
    },
  };
  const url = await comfyui(
    {
      prompt: _prompt,
      path: "14.images.0",
    },
    cb
  );
  console.log("need generate image", prompt, width, height, url);
  await loadUrl(url);
  return url;
};

export const iNiverseMix_doc: DOC = [
  "使用iNiverseMix模型进行文生图，这个模型擅长亚洲国风少女的绘制",
  [
    ["width", "int", "width of image"],
    ["height", "int", "height of image"],
    ["prompt", "string", "prompt to generate image, only support english"],
  ],
];

export const iNiverseMix: TOOL_FUNCTION = async (args) => {
  const { prompt, width, height } = args;

  const _prompt = {
    "3": {
      inputs: {
        seed: 693312442446083,
        steps: 35,
        cfg: 8,
        sampler_name: "dpmpp_sde",
        scheduler: "karras",
        denoise: 1,
        model: ["4", 0],
        positive: ["14", 0],
        negative: ["7", 0],
        latent_image: ["5", 0],
      },
      class_type: "KSampler",
      _meta: {
        title: "K采样器",
      },
    },
    "4": {
      inputs: {
        ckpt_name:
          "iNiverseMix/iniverseMixSFWNSFW_ponyRealGuofengV51.safetensors",
      },
      class_type: "CheckpointLoaderSimple",
      _meta: {
        title: "Checkpoint加载器（简易）",
      },
    },
    "5": {
      inputs: {
        width,
        height,
        batch_size: 1,
      },
      class_type: "EmptyLatentImage",
      _meta: {
        title: "空Latent图像",
      },
    },
    "7": {
      inputs: {
        text: "score_5, score_4, low quality, anime,monochrome, deformed, bad lips, bad mouth, pants, bald woman, bald girl, bald woman, bad anatomy, worst face, bad eyes, bad nose, duplicate, twins, mixed style, teeth worst quality, low quality, bad anatomy undetailed CGI render anti airbrushing undetailed eyes and thin and sketch and unclear, duplicate watermark, 3d, Two heads, doll, extra nipples, bad anatomy, blurry, duplicate, fuzzy, extra arms, extra fingers, poorly drawn hands disfigured, deformed, mutated, bad hands, extra hands, extra fingers, too many fingers, fused fingers, bad arm, distorted arms, extra arms, disembodied leg, extra nipples, detached arms, inverted hand, disembodied limb, oversized head, duplicate, ugly, tanlines, rays",
        clip: ["4", 1],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP文本编码",
      },
    },
    "8": {
      inputs: {
        samples: ["3", 0],
        vae: ["4", 2],
      },
      class_type: "VAEDecode",
      _meta: {
        title: "VAE解码",
      },
    },
    "10": {
      inputs: {
        images: ["8", 0],
      },
      class_type: "PreviewImage",
      _meta: {
        title: "预览图像",
      },
    },
    "14": {
      inputs: {
        text: prompt,
        clip: ["4", 1],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP文本编码",
      },
    },
  };

  const url = await comfyui({
    prompt: _prompt,
    path: "10.images.0",
  });
  console.log("need generate image", prompt, width, height, url);
  await loadUrl(url);
  return url;
};
