import { comfyui, loadUrl } from "../ElectronWindow";
import { DOC, getRandomInt, TOOL_FUNCTION } from "./common";

export const ltxvideo_doc: DOC = [
  "使用ltxvideo模型通过文本生成视频",
  [
    ["width", "int", "width of video"],
    ["height", "int", "height of video"],
    ["duration", "int", "seconds of video"],
    ["prompt", "string", "prompt to generate video, only support english"],
  ],
];

export const ltxvideo: TOOL_FUNCTION = async (args, cb) => {
  const { prompt, width, height, duration } = args;
  const frame_rate = 25;
  const _prompt = {
    "8": {
      inputs: {
        samples: ["81", 0],
        vae: ["44", 2],
      },
      class_type: "VAEDecode",
      _meta: {
        title: "VAE解码",
      },
    },
    "38": {
      inputs: {
        clip_name: "t5/google_t5-v1_1-xxl_encoderonly-fp16.safetensors",
        type: "ltxv",
        device: "default",
      },
      class_type: "CLIPLoader",
      _meta: {
        title: "加载CLIP",
      },
    },
    "44": {
      inputs: {
        ckpt_name: "LTXV/ltx-video-2b-v0.9.5.safetensors",
      },
      class_type: "CheckpointLoaderSimple",
      _meta: {
        title: "Checkpoint加载器（简易）",
      },
    },
    "69": {
      inputs: {
        frame_rate,
        positive: ["91", 0],
        negative: ["90", 0],
      },
      class_type: "LTXVConditioning",
      _meta: {
        title: "LTXV条件",
      },
    },
    "71": {
      inputs: {
        steps: 20,
        max_shift: 2.05,
        base_shift: 0.95,
        stretch: true,
        terminal: 0.1,
        latent: ["84", 0],
      },
      class_type: "LTXVScheduler",
      _meta: {
        title: "LTXV调度器",
      },
    },
    "73": {
      inputs: {
        sampler_name: "gradient_estimation",
      },
      class_type: "KSamplerSelect",
      _meta: {
        title: "K采样器选择",
      },
    },
    "79": {
      inputs: {
        block_indices: "14",
        model: ["44", 0],
      },
      class_type: "LTXVApplySTG",
      _meta: {
        title: "🅛🅣🅧 LTXV Apply STG",
      },
    },
    "81": {
      inputs: {
        noise: ["83", 0],
        guider: ["89", 0],
        sampler: ["73", 0],
        sigmas: ["71", 0],
        latent_image: ["84", 0],
      },
      class_type: "SamplerCustomAdvanced",
      _meta: {
        title: "自定义采样器（高级）",
      },
    },
    "82": {
      inputs: {
        cfg: 3,
        stg: 1,
        rescale: 0.75,
        model: ["79", 0],
        positive: ["69", 0],
        negative: ["69", 1],
      },
      class_type: "STGGuider",
      _meta: {
        title: "🅛🅣🅧 STG Guider",
      },
    },
    "83": {
      inputs: {
        noise_seed: 42,
      },
      class_type: "RandomNoise",
      _meta: {
        title: "随机噪波",
      },
    },
    "84": {
      inputs: {
        width,
        height,
        length: duration * frame_rate,
        batch_size: 1,
      },
      class_type: "EmptyLTXVLatentVideo",
      _meta: {
        title: "空Latent视频（LTXV）",
      },
    },
    "88": {
      inputs: {
        frame_rate,
        loop_count: 0,
        filename_prefix: "ltxv",
        format: "video/h264-mp4",
        pix_fmt: "yuv420p",
        crf: 19,
        save_metadata: true,
        trim_to_audio: false,
        pingpong: false,
        save_output: true,
        images: ["8", 0],
      },
      class_type: "VHS_VideoCombine",
      _meta: {
        title: "Video Combine 🎥🅥🅗🅢",
      },
    },
    "89": {
      inputs: {
        value: ["82", 0],
      },
      class_type: "UnloadAllModels",
      _meta: {
        title: "UnloadAllModels",
      },
    },
    "90": {
      inputs: {
        text: "",
        clip: ["38", 0],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP文本编码",
      },
    },
    "91": {
      inputs: {
        text: prompt,
        clip: ["38", 0],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP文本编码",
      },
    },
  };
  const url = await comfyui(
    {
      prompt: _prompt,
      path: "88.gifs.0",
    },
    cb
  );
  console.log("need generate video", prompt, width, height, url);
  if (url.startsWith("http")) {
    await loadUrl(url);
    return {
      type: "video",
      url,
    };
  }
  return url;
};

export const flux_doc: DOC = [
  "使用flux模型进行文生图",
  [
    [
      "mode",
      "int",
      "1:代表横屏,长宽是1280x720， 2:代表竖屏,长宽是720x1280 3:代表长宽是1024x1024",
    ],
    ["prompt", "string", "prompt to generate image, only support english"],
  ],
];

export const flux: TOOL_FUNCTION = async (args, cb) => {
  const { prompt, mode } = args;
  const width = mode == 1 ? 1280 : mode == 2 ? 720 : 1024;
  const height = mode == 1 ? 720 : mode == 2 ? 1280 : 1024;
  const _prompt = {
    "3": {
      inputs: {
        seed: getRandomInt(1000, 10000000000),
        steps: 25,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 0.9600000000000002,
        model: ["21", 0],
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
        clip: ["21", 1],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP文本编码",
      },
    },
    "7": {
      inputs: {
        text: "(ugly, deformed, mutated, disfigured:1.3), (realistic humans, people:1.2), (simple background, plain background:1.0), (low quality, \nblurry, pixelated:1.3), (text, watermark, signature:1.2), (cartoon, anime:1.0)",
        clip: ["21", 1],
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
    "21": {
      inputs: {
        lora_name: "uncensored-v2.safetensors",
        strength_model: 1,
        strength_clip: 1,
        model: ["10", 0],
        clip: ["18", 0],
      },
      class_type: "LoraLoader",
      _meta: {
        title: "加载LoRA",
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
  if (url.startsWith("http")) {
    await loadUrl(url);
    return {
      type: "photo",
      url,
    };
  }
  return url;
};
