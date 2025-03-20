export async function iNiverseMix(event, args) {
  const { prompt, width, height } = args;
  const COMFYUI_URI = process.env["COMFYUI_URI"];
  console.log("need generate image", prompt, width, height, COMFYUI_URI);
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
  let promptid;
  {
    console.log("genurate", `${COMFYUI_URI}/prompt`, JSON.stringify());
    const rsp = await fetch(`${COMFYUI_URI}/prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: _prompt,
      }),
    });
    const json = await rsp.json();
    console.log("genurate rsp", json);
    promptid = json.prompt_id;
    if (!promptid) throw new Error("genurate fail!");
  }
  {
    const progressUrl = `${COMFYUI_URI}/history/${promptid}`;
    const done = false;
    while (!done) {
      const rsp = await fetch(progressUrl);
      const json = await rsp.json();
      console.log("progress", json);
      if (
        json[promptid] &&
        json[promptid].outputs &&
        json[promptid].outputs[10] &&
        json[promptid].outputs[10].images &&
        json[promptid].outputs[10].images.length
      ) {
        const { filename, subfolder, type } =
          json[promptid].outputs[10].images[0];
        const imgurl = `${COMFYUI_URI}/view?filename=${filename}&subfolder=${
          subfolder || ""
        }&type=${type}`;
        return imgurl;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
