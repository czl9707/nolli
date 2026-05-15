import { Map, MapControls } from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"

export default function Page() {
  return (
    <div className="w-full h-full">
      <Map styles={{ light: getMapStyle("light"), dark: getMapStyle("dark") }}>
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
