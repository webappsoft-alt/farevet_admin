import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Skeleton, message } from "antd";
import { apiRequest } from "../../api/auth_api";

const CDN_SCRIPT =
  "https://cdn.ckeditor.com/ckeditor5/41.4.2/super-build/ckeditor.js";

const DEFAULT_TOOLBAR_RESERVE = 96;

function buildIframeHtml({ editableMinPx, autoGrow, maxEditablePx }) {
  const editableMaxRule = autoGrow
    ? `max-height: ${maxEditablePx}px !important;`
    : "max-height: none !important;";

  const layoutStyles = autoGrow
    ? `
          body { margin: 0; padding: 0; font-family: sans-serif; height: auto; display: block; overflow: visible; background: #fff; box-sizing: border-box; }
          #editor-container { display: flex; flex-direction: column; border-radius: 12px; overflow: visible; }
          .ck-editor { display: flex !important; flex-direction: column !important; height: auto !important; border-radius: 12px !important; }
          .ck-editor__main { display: flex !important; flex-direction: column !important; overflow: visible !important; }
          .ck-editor__editable_inline { overflow-y: auto !important; min-height: unset !important; padding: 0.75rem 1rem !important; }
    `
    : `
          body { margin: 0; padding: 0; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; background: #fff; box-sizing: border-box; }
          #editor-container { flex-grow: 1; display: flex; flex-direction: column; height: 100vh; border-radius: 12px; overflow: hidden; }
          .ck-editor { display: flex !important; flex-direction: column !important; flex-grow: 1 !important; height: 100% !important; border-radius: 12px !important; }
          .ck-editor__main { flex-grow: 1 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
          .ck-editor__editable_inline { flex-grow: 1 !important; overflow-y: auto !important; min-height: unset !important; padding: 1rem 2rem !important; }
    `;

  const autoGrowScript = autoGrow
    ? `
          function reportHeight() {
            if (!editorInstance) return;
            const editable = editorInstance.ui.view.editable.element;
            const toolbar = editorInstance.ui.view.toolbar.element;
            const toolbarH = toolbar ? toolbar.offsetHeight : 0;
            const editableH = editable ? editable.scrollHeight : 0;
            window.parent.postMessage({
              type: 'resize',
              height: toolbarH + editableH + 12,
            }, '*');
          }
    `
    : "";

  const changeHandler = autoGrow
    ? `
              editor.model.document.on('change:data', () => {
                window.parent.postMessage({ type: 'change', data: editor.getData() }, '*');
                requestAnimationFrame(reportHeight);
              });
              requestAnimationFrame(reportHeight);
    `
    : `
              editor.model.document.on('change:data', () => {
                window.parent.postMessage({ type: 'change', data: editor.getData() }, '*');
              });
    `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${layoutStyles}
          .ck.ck-editor__main > .ck-editor__editable {
            background: white !important;
            border-radius: 0 0 12px 12px !important;
            border-top: none !important;
            min-height: ${editableMinPx}px !important;
            ${editableMaxRule}
            padding: ${autoGrow ? "0.75rem 1rem" : "1.5rem"} !important;
            overflow-y: auto !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            height: auto !important;
          }
          .ck.ck-editor__top .ck-sticky-panel .ck-toolbar { border-radius: 12px 12px 0 0 !important; border-bottom: 1px solid #ccced1 !important; }
          .ck-content figure.image {
            display: inline-block !important;
            margin: 0 3px 3px 0 !important;
            vertical-align: top !important;
          }
          .ck-content figure.image img {
            display: inline-block !important;
            vertical-align: top !important;
            max-width: 100% !important;
            height: auto !important;
          }
          .ck.ck-image-upload-placeholder {
            position: relative;
            min-height: 150px;
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .ck.ck-image-upload-placeholder::after {
            content: "";
            position: absolute;
            width: 40px;
            height: 40px;
            border: 4px solid #e9ecef;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: ck-upload-spin 0.8s linear infinite;
            z-index: 10;
          }
          .ck.ck-image-upload-placeholder::before {
            content: "Uploading Image...";
            position: absolute;
            bottom: 20px;
            font-size: 12px;
            color: #6c757d;
            font-family: inherit;
          }
          @keyframes ck-upload-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .ck-button { border-radius: 8px !important; }
          .ck-body-wrapper { z-index: 10000 !important; position: fixed !important; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #f1f1f1; }
          ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #bbb; }
        </style>
      </head>
      <body>
        <div id="editor-container">
            <div id="editor"></div>
        </div>

        <script>
          let editorInstance;
          ${autoGrowScript}
          function handleLoadError() {
            window.parent.postMessage({ type: 'error', error: 'Failed to load script' }, '*');
          }
          function initCKEditor() {
            const CK = window.CKSource || window.CKEDITOR;
            if (!CK) { handleLoadError(); return; }

            const targetElement = document.querySelector('#editor');
            if (!targetElement) {
                console.error("Editor element not found");
                return;
            }

            CK.ClassicEditor.create(targetElement, {
              toolbar: {
                items: [
                  "heading", "|", "fontSize", "fontFamily", "fontColor", "fontBackgroundColor", "|",
                  "bold", "italic", "underline", "strikethrough", "|",
                  "link", "bulletedList", "numberedList", "|",
                  "alignment", "outdent", "indent", "|",
                  "imageUpload", "blockQuote", "insertTable", "highlight", "|",
                  "undo", "redo",
                ],
                shouldNotGroupWhenFull: true
              },
              autoFocus: false,
              image: {
                toolbar: [
                  "toggleImageCaption", "imageTextAlternative", "|",
                  "imageStyle:alignLeft", "imageStyle:alignCenter", "imageStyle:alignRight", "|",
                  "imageStyle:inline", "imageStyle:wrapText", "imageStyle:breakText", "|",
                  "resizeImage",
                ],
                insert: { type: 'auto' },
                styles: [
                    'full',
                    'side',
                    'alignLeft',
                    'alignCenter',
                    'alignRight'
                ],
                resizeUnit: "%",
              },
              table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"] },
              removePlugins: [
                "AIAssistant", "CKBox", "CKFinder", "EasyImage", "RealTimeCollaborativeComments",
                "RealTimeCollaborativeTrackChanges", "RealTimeCollaborativeRevisionHistory",
                "PresenceList", "Comments", "TrackChanges", "TrackChangesData", "RevisionHistory",
                "Pagination", "WProofreader", "MathType", "SlashCommand", "Template",
                "DocumentOutline", "FormatPainter", "TableOfContents", "PasteFromOfficeEnhanced",
                "CaseChange", "MultiLevelList", "ExportPdf", "ExportWord", "ImportWord", "FullPage",
                "GeneralHtmlSupport", "Style", "SourceEditing", "Markdown", "HtmlEmbed", "Base64UploadAdapter"
              ],
              extraPlugins: [
                  function(editor) {
                      editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                          return {
                              upload() {
                                  return loader.file.then(file => new Promise((resolve, reject) => {
                                      window.parent.postMessage({ type: 'uploadImage', file: file }, '*');
                                      const onMessage = (e) => {
                                          if (e.data.type === 'uploadSuccess') {
                                              window.removeEventListener('message', onMessage);
                                              resolve({ default: e.data.url });
                                          } else if (e.data.type === 'uploadError') {
                                              window.removeEventListener('message', onMessage);
                                              try {
                                                const selectedElement = editor.model.document.selection.getSelectedElement();
                                                if (selectedElement && (selectedElement.name === 'imageBlock' || selectedElement.name === 'imageInline')) {
                                                  editor.model.change(writer => {
                                                    writer.remove(selectedElement);
                                                  });
                                                }
                                              } catch (err) {
                                                console.error("Failed to remove image element:", err);
                                              }
                                              reject(e.data.error);
                                          }
                                      };
                                      window.addEventListener('message', onMessage);
                                  }));
                              },
                              abort() {}
                          };
                      };
                  }
              ]
            }).then(editor => {
              editorInstance = editor;
              window.parent.postMessage({ type: 'ready' }, '*');
              ${changeHandler}
            }).catch(error => {
              window.parent.postMessage({ type: 'error', error: error.message }, '*');
            });
          }
          window.addEventListener('message', (event) => {
            if (event.data.type === 'setData' && editorInstance) {
              if (editorInstance.getData() !== event.data.data) {
                editorInstance.setData(event.data.data || '');
              }
              ${autoGrow ? "requestAnimationFrame(reportHeight);" : ""}
            }
          });
        </script>
        <script src="${CDN_SCRIPT}" onload="initCKEditor()" onerror="handleLoadError()"></script>
      </body>
    </html>
  `;
}

/**
 * Premium CKEditor 5 (super-build) inside an iframe — CDN script, image upload via Farevet `upload_data` API.
 * Drop-in style API: `value` / `onChange` like controlled textarea.
 */
function CKEditorIframe({
  value = "",
  onChange,
  minHeight = 400,
  maxHeight,
  autoGrow = false,
  className = "",
}) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const editableMin = autoGrow ? Math.max(72, minHeight) : Math.max(280, minHeight);
  const maxEditablePx = autoGrow
    ? Math.max(editableMin + 40, maxHeight ? maxHeight - DEFAULT_TOOLBAR_RESERVE : 360)
    : null;
  const initialIframeHeight = autoGrow
    ? editableMin + DEFAULT_TOOLBAR_RESERVE
    : Math.min(Math.max(editableMin + 120, 520), 900);
  const maxIframeHeight = autoGrow
    ? Math.max(
        initialIframeHeight,
        maxHeight || editableMin + DEFAULT_TOOLBAR_RESERVE + 280,
      )
    : initialIframeHeight;
  const [iframeHeight, setIframeHeight] = useState(initialIframeHeight);
  /* Stable srcDoc — changing string every parent re-render would reload the iframe */
  const iframeHtml = useMemo(
    () =>
      buildIframeHtml({
        editableMinPx: editableMin,
        autoGrow,
        maxEditablePx,
      }),
    [editableMin, autoGrow, maxEditablePx],
  );

  const runUpload = useCallback(async (file) => {
    const win = iframeRef.current?.contentWindow;
    if (!file || !win) return;

    const body = new FormData();
    body.append("type", "upload_data");
    body.append(
      "file",
      new Blob([file], { type: file.type || "application/octet-stream" }),
      file.name || "image",
    );

    try {
      const res = await apiRequest({ body });
      const fileName = res?.file_name;
      const base = (typeof global !== "undefined" && global.IMAGEURL) || "";
      const url = fileName
        ? `${String(base).replace(/\/$/, "")}/${fileName}`
        : res?.url || res?.file;

      if (url) {
        message.success("Image uploaded.");
        win.postMessage({ type: "uploadSuccess", url }, "*");
      } else {
        message.error("Upload failed: no file returned");
        win.postMessage(
          { type: "uploadError", error: "Upload failed" },
          "*",
        );
      }
    } catch (err) {
      message.error(err?.message || "Upload failed");
      win.postMessage(
        { type: "uploadError", error: err?.message || "Upload failed" },
        "*",
      );
    }
  }, []);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "ready") {
        setLoading(false);
      } else if (event.data.type === "resize" && autoGrow) {
        const nextHeight = Math.min(
          maxIframeHeight,
          Math.max(initialIframeHeight, Number(event.data.height) || initialIframeHeight),
        );
        setIframeHeight(nextHeight);
      } else if (event.data.type === "change" && typeof onChange === "function") {
        onChange(event.data.data);
      } else if (event.data.type === "uploadImage") {
        const { file } = event.data;
        await runUpload(file);
      } else if (event.data.type === "error") {
        console.error("CKEditor iframe:", event.data.error);
        message.error(String(event.data.error || "Editor error"));
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [autoGrow, initialIframeHeight, maxIframeHeight, onChange, runUpload]);

  useEffect(() => {
    if (!autoGrow) return;
    setIframeHeight(initialIframeHeight);
  }, [autoGrow, initialIframeHeight, iframeHtml]);

  useEffect(() => {
    if (!loading && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "setData", data: value },
        "*",
      );
    }
  }, [loading, value]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        minHeight: iframeHeight,
        border: "1px solid var(--edu-border, #e8e8f0)",
        borderRadius: 12,
        background: "#fff",
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      {loading ? (
        <div className="p-4" style={{ height: iframeHeight }}>
          <Skeleton
            active
            avatar={{ size: "small", shape: "square" }}
            paragraph={{ rows: autoGrow ? 3 : 12 }}
          />
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        title="Article editor"
        srcDoc={iframeHtml}
        style={{
          width: "100%",
          height: iframeHeight,
          border: "none",
          display: loading ? "none" : "block",
          borderRadius: 12,
          verticalAlign: "top",
        }}
      />
    </div>
  );
}

export default CKEditorIframe;
