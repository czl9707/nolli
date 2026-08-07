import { Img, staticFile } from "remotion";

export const Hero: React.FC<{ slug: string; buildingSlug: string }> = ({ slug, buildingSlug }) => (
  <div style={{ flex: 1, minHeight: 0, borderRadius: 12, overflow: "hidden" }}>
    <Img src={staticFile(`capture/${slug}/images/${buildingSlug}-hero.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);
