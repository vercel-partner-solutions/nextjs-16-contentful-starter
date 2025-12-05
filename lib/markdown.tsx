import { ContentfulImage } from "@/components/contentful-image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Document } from "@contentful/rich-text-types";

export function Markdown({ content }: { content: Document }) {
  return documentToReactComponents(content, {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (_node, children) => (
        <p className="mb-4">{children}</p>
      ),
      [BLOCKS.HEADING_1]: (_node, children) => (
        <h1 className="text-3xl font-semibold mb-4">{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (_node, children) => (
        <h2 className="text-2xl font-semibold mb-4">{children}</h2>
      ),
      [BLOCKS.HEADING_3]: (_node, children) => (
        <h3 className="text-xl font-semibold mb-4">{children}</h3>
      ),
      [BLOCKS.HEADING_4]: (_node, children) => (
        <h4 className="text-lg font-semibold mb-4">{children}</h4>
      ),
      [BLOCKS.HEADING_5]: (_node, children) => (
        <h5 className="text-base font-semibold mb-4">{children}</h5>
      ),
      [BLOCKS.HEADING_6]: (_node, children) => (
        <h6 className="text-sm font-semibold mb-4">{children}</h6>
      ),
      [BLOCKS.EMBEDDED_ASSET]: (node) => (
        <ContentfulImage
          src={node.data.target.url}
          alt={node.data.target.description}
          width={node.data.target.details.image.width}
          height={node.data.target.details.image.height}
        />
      ),
    },
  });
}
