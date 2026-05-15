import { Map, MapControls } from "@/components/ui/map"

export default function Page() {
  return (
    <div className="w-full h-full">
      <Map>
        <MapControls
          className="right-2 bottom-16"
          showZoom
          showCompass
          showLocate
        />
      </Map>
    </div>
  );
}
