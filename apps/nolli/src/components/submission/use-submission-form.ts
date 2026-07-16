import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { SubmissionPayload } from "@nolli/data"
import { uploadImage, UnauthorizedError } from "@/lib/api/submissions"
import { useAuthStore } from "@/stores/auth"
import {
  formValuesSchema,
  shapePayload,
  resolvePhotos,
  type FormValues,
} from "./shape-payload"

export const EMPTY: FormValues = {
  metadata: {
    name: "", architect: "", year: NaN, address: "", city: "", country: "",
    latitude: NaN, longitude: NaN, google_maps_url: "",
  },
  photos: [],
  notes: [],
  links: [],
}

export function handleError(err: unknown, signIn: () => Promise<void>) {
  if (err instanceof UnauthorizedError) {
    toast.error("Session expired — signing in again.")
    void signIn()
  } else {
    toast.error("Something went wrong. Please try again.")
  }
}

export function useSubmissionForm({
  onSubmit,
}: {
  onSubmit: (payload: SubmissionPayload, values: FormValues) => Promise<void>
}) {
  const signIn = useAuthStore((s) => s.signIn)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formValuesSchema),
    defaultValues: EMPTY,
    mode: "onChange",
  })

  const submit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const photos = await resolvePhotos(values.photos, uploadImage)
      const payload = shapePayload({ ...values, photos })
      await onSubmit(payload, values)
    } catch (err) {
      handleError(err, signIn)
    } finally {
      setSaving(false)
    }
  })

  return { form, saving, submit }
}
