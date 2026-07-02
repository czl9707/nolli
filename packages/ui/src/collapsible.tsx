import * as React from "react"
import { Collapsible as C } from "radix-ui"

function Collapsible(props: React.ComponentProps<typeof C.Root>) {
  return <C.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger(props: React.ComponentProps<typeof C.Trigger>) {
  return <C.Trigger data-slot="collapsible-trigger" {...props} />
}

function CollapsibleContent(props: React.ComponentProps<typeof C.Content>) {
  return <C.Content data-slot="collapsible-content" {...props} />
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
