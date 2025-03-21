export async function nextPage(event, args, rightView) {
  if (rightView) {
    console.log("next-page called");
    const bounds = rightView.getBounds();
    setTimeout(() => {
      rightView.webContents.sendInputEvent({
        type: "mouseWheel",
        x: bounds.width / 2, // 触发滚动的 X 坐标（屏幕中的某处）
        y: bounds.height / 2, // 触发滚动的 Y 坐标
        deltaX: 0, // 不左右滚动
        deltaY: -bounds.height * 0.8, // 负值代表向上滚动，数值控制滚动距离
        canScroll: true,
      });
    }, 1000);
  } else {
    console.error("rightView is not available.");
  }
}

export async function changeUrl(event, url, rightView) {
  if (rightView) {
    console.log(`right view should load url ${url}`);
    return new Promise((r) => {
      rightViewDomReadyResolve = r;
      rightView.webContents.loadURL(url);
    });
  } else {
    console.error("rightView is not available.");
  }
}

export async function captureRightView(event, url, rightView) {
  if (!rightView) {
    console.error("rightView or mainWindow is not available.");
    return null;
  }
  try {
    const bounds = rightView.getBounds();
    const rect = {
      x: 0,
      y: 0,
      width: bounds.width,
      height: bounds.height,
    };
    console.log("need capture page", rect);

    const image = await rightView.webContents.capturePage(rect);

    return image.toDataURL();
  } catch (error) {
    console.error("Error capturing right view:", error);
    return null;
  }
}

export async function dumpFull(event, url, rightView) {
  const result = await rightView.webContents.executeJavaScript(`(()=>{
      
        function dumpFull(node,viewpoint={left:0,top:0,right:window.innerWidth, bottom:window.innerHeight}) {
            let result = "";
            if (['SCRIPT', 'STYLE', 'NOSCRIPT','#comment'].indexOf(node.nodeName)>=0) return result;
            if (!node.getBoundingClientRect) return result;
            if (node.textContent) {
                for (const c of (node.childNodes || [])) {
                    if (c.nodeName == "#text") {
                        result += c.textContent;
                    } else {
                        if (c.nodeName == 'A' && inside) {
                            result += \`<a href="\${c.href}">\`
                        }
                        result += \` \${dumpFull(c, viewpoint, result).trim()} \`;
                        if (c.nodeName == 'A' && inside) {
                            result += \`</a>\`
                        }
                    }
                }        
            }
            return result;
        }
        
              return dumpFull(document.body)
        })()`);
  console.log("page text", result);
  return result;
}

export async function dumpVisible(event, url, rightView) {
  const result = await rightView.webContents.executeJavaScript(`(()=>{
      
        function dumpvisible(node,viewpoint={left:0,top:0,right:window.innerWidth, bottom:window.innerHeight}) {
            let result = "";
            if (['SCRIPT', 'STYLE', 'NOSCRIPT','#comment'].indexOf(node.nodeName)>=0) return result;
            if (!node.getBoundingClientRect) return result;
            if (node.textContent) {
                const rect = node.getBoundingClientRect();
                let inside = false
                if (node.checkVisibility && !node.checkVisibility()) {
                    return result;
                }
                if (rect.left >= viewpoint.left && rect.right <= viewpoint.right && rect.top >= viewpoint.top && rect.bottom <= viewpoint.bottom) {
                    inside = true;
                }
                for (const c of (node.childNodes || [])) {
                    if (c.nodeName == "#text") {
                        if (inside) {
                            result += c.textContent;
                        }
                    } else {
                        if (c.nodeName == 'A' && inside) {
                            result += \`<a href="\${c.href}">\`
                        }
                        result += \` \${dumpvisible(c, viewpoint, result).trim()} \`;
                        if (c.nodeName == 'A' && inside) {
                            result += \`</a>\`
                        }
                    }
                }        
            }
            return result;
        }
        
              return dumpvisible(document.body)
        })()`);
  console.log("page text", result);
  return result;
}
