import { MapMarker, MarkerContent } from "@nolli/map";

/**
 * A prominent overlay for the currently-selected building, rendered as a child
 * of <ArchMap> so it lives inside the map. ArchMap's own markers cluster at the
 * low fit-zoom and would hide the selection; this overlay is always individual,
 * pinned to the building's exact coordinates, and shows its name — so the
 * selection reads clearly even at a global zoom.
 */
export const SelectedMarker: React.FC<{
  lng: number;
  lat: number;
  label: string;
}> = ({ lng, lat, label }) => (
  <MapMarker longitude={lng} latitude={lat} anchor="bottom">
    <MarkerContent>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: "translate(-50%, -100%)",
        }}
      >
        <div
          style={{
            background: "rgb(var(--color-primary-background))",
            color: "rgb(var(--color-primary-foreground))",
            padding: "3px 10px",
            borderRadius: "var(--size-border-radius)",
            whiteSpace: "nowrap",
            fontSize: 16,
            fontWeight: 600,
            boxShadow: "var(--shadow-sm)",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "rgb(var(--color-accent-foreground))",
            boxShadow:
              "0 0 0 3px rgb(var(--color-primary-background)), 0 0 0 5px rgb(var(--color-accent-foreground) / 0.45)",
          }}
        />
      </div>
    </MarkerContent>
  </MapMarker>
);
