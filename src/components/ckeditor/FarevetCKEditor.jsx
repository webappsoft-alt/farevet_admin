import React, { useMemo } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Heading,
  Link,
  List,
  BlockQuote,
  HorizontalLine,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import "./FarevetCKEditor.scss";

const DEFAULT_MIN_HEIGHT = 320;

function buildEditorConfig(placeholder) {
  return {
    licenseKey: "GPL",
    plugins: [
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Underline,
      Heading,
      Link,
      List,
      BlockQuote,
      HorizontalLine,
    ],
    heading: {
      options: [
        {
          model: "paragraph",
          title: "Paragraph",
          class: "ck-heading_paragraph",
        },
        {
          model: "heading2",
          view: "h2",
          title: "Heading 2",
          class: "ck-heading_heading2",
        },
        {
          model: "heading3",
          view: "h3",
          title: "Heading 3",
          class: "ck-heading_heading3",
        },
      ],
    },
    toolbar: [
      "undo",
      "redo",
      "|",
      "heading",
      "|",
      "bold",
      "italic",
      "underline",
      "|",
      "link",
      "|",
      "bulletedList",
      "numberedList",
      "|",
      "blockQuote",
      "horizontalLine",
    ],
    link: {
      defaultProtocol: "https://",
    },
    placeholder: placeholder || "",
  };
}

/**
 * @param {object} props
 * @param {string} props.value - HTML string (bound to editor `data`).
 * @param {(html: string) => void} props.onChange - Fires with editor HTML.
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className] - Wrapper class(es).
 * @param {string|number} [props.id] - Pass a new value when you need a fresh editor instance (e.g. form reset).
 * @param {number} [props.minHeight] - Editable area min height in px.
 * @param {(editor: import('ckeditor5').ClassicEditor) => void} [props.onReady]
 */
function FarevetCKEditor({
  value = "",
  onChange,
  placeholder = "",
  disabled = false,
  className = "",
  id,
  minHeight = DEFAULT_MIN_HEIGHT,
  onReady,
}) {
  const config = useMemo(
    () => buildEditorConfig(placeholder),
    [placeholder],
  );

  return (
    <div
      className={["farevet-ck-editor", className].filter(Boolean).join(" ")}
      style={{
        // drives .ck-editor__editable min-height inside FarevetCKEditor.scss
        "--farevet-ck-min-h": `${minHeight}px`,
      }}
    >
      <CKEditor
        id={id}
        editor={ClassicEditor}
        config={config}
        data={value}
        disabled={disabled}
        onReady={onReady}
        onChange={(_event, editor) => {
          if (typeof onChange === "function") {
            onChange(editor.getData());
          }
        }}
      />
    </div>
  );
}

export default FarevetCKEditor;
export { buildEditorConfig, ClassicEditor };
