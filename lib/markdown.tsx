import { ContentfulImage } from "@/components/contentful-image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Document } from "@contentful/rich-text-types";

interface Asset {
  sys: {
    id: string;
  };
  url: string;
  description: string;
}

interface AssetLink {
  block: Asset[];
}

interface Content {
  json: Document;
  links: {
    assets: AssetLink;
  };
}

function RichTextAsset({
  id,
  assets,
}: {
  id: string;
  assets: Asset[] | undefined;
}) {
  const asset = assets?.find((asset) => asset.sys.id === id);

  if (asset?.url) {
    return (
      <ContentfulImage
        src={asset.url}
        alt={asset.description || ""}
        width={800}
        height={400}
        className="w-full h-auto"
      />
    );
  }

  return null;
}

export function Markdown({ content }: { content: Content }) {
  return documentToReactComponents(content.json, {
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
        <RichTextAsset
          id={node.data.target.sys.id}
          assets={content.links.assets.block}
        />
      ),
    },
  });
}
