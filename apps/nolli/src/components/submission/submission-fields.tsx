import { useMemo } from "react"
import {
  Controller,
  useWatch,
  type Control,
  type UseFormReturn,
} from "react-hook-form"
import { Input, Caption, Body1, Body3 } from "@nolli/ui"
import { slugify, buildGoogleMapsUrl, useFilterOptions } from "@nolli/data"
import { PhotoUploader } from "./photo-uploader"
import { NoteEditor } from "./note-editor"
import { LinkEditor } from "./link-editor"
import { SubmissionCombobox, type ComboboxItem } from "./submission-combobox"
import { Info } from 'lucide-react'
import type { FormValues } from "./shape-payload"
import styles from "./submission-fields.module.css"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <Body3 className={styles.error}>{message}</Body3>
}

type CityOption = { id: number; name: string; countryCode: string }
type CountryOption = { code: string; name: string }

function useScopedCities(
  control: Control<FormValues>,
  cities: readonly CityOption[],
  countries: readonly CountryOption[],
): ComboboxItem[] {
  const countryName = useWatch({ control, name: "metadata.country" })
  return useMemo(() => {
    const code = countries.find((c) => c.name === countryName)?.code
    const scoped = code ? cities.filter((c) => c.countryCode === code) : cities
    return scoped.map((c) => ({ value: c.name, label: c.name }))
  }, [cities, countries, countryName])
}

export function SubmissionFields({ form }: { form: UseFormReturn<FormValues> }) {
  const name = form.watch("metadata.name")
  const mapCity = form.watch("metadata.city")
  const mapCountry = form.watch("metadata.country")
  const { options, dbError } = useFilterOptions()
  const countries = options?.countries ?? []
  const architects = options?.architects ?? []
  const cities = options?.cities ?? []
  const listDisabled = options === null || dbError !== null
  const scopedCities = useScopedCities(form.control, cities, countries)
  const architectItems = architects.map((a) => ({ value: a.name, label: a.name }))
  const countryItems = countries.map((c) => ({ value: c.name, label: c.name }))

  function onCityChange(nextCity: string) {
    form.setValue("metadata.city", nextCity)
    const hit = cities.find((c) => c.name === nextCity)
    if (hit) {
      const countryName = countries.find((co) => co.code === hit.countryCode)?.name
      if (countryName) form.setValue("metadata.country", countryName)
    }
  }

  function onCountryChange(nextCountry: string) {
    const prev = form.getValues("metadata.country")
    form.setValue("metadata.country", nextCountry)
    if (prev !== nextCountry) form.setValue("metadata.city", "")
  }

  return (
    <div className={styles.columns}>
      <section className={styles.section}>
        <Body1 className={styles.sectionTitle}>Details</Body1>
        <div className={styles.section1Fields}>
          <label className={styles.field}>
            <Caption>Name</Caption>
            <Input {...form.register("metadata.name")} />
            <FieldError message={form.formState.errors.metadata?.name?.message} />
            {name && <Caption className={styles.slug}>slug: {slugify(name)}</Caption>}
          </label>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <Caption>Architect</Caption>
              <Controller
                control={form.control}
                name="metadata.architect"
                render={({ field }) => (
                  <SubmissionCombobox
                    mode="suggest"
                    label="Architect"
                    placeholder="Search architects"
                    items={architectItems}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={listDisabled}
                  />
                )}
              />
              <FieldError message={form.formState.errors.metadata?.architect?.message} />
            </label>
            <label className={styles.field}>
              <Caption>Year</Caption>
              <Input type="number" {...form.register("metadata.year", { valueAsNumber: true })} />
              <FieldError message={form.formState.errors.metadata?.year?.message} />
            </label>
          </div>
          <label className={styles.field}>
            <Caption>Address</Caption>
            <Input {...form.register("metadata.address")} />
            <FieldError message={form.formState.errors.metadata?.address?.message} />
          </label>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <Caption>City</Caption>
              <Controller
                control={form.control}
                name="metadata.city"
                render={({ field }) => (
                  <SubmissionCombobox
                    mode="suggest"
                    label="City"
                    placeholder={dbError ? "Couldn't load cities" : "Search cities"}
                    items={scopedCities}
                    value={field.value}
                    onChange={onCityChange}
                    onBlur={field.onBlur}
                    disabled={listDisabled}
                  />
                )}
              />
              <FieldError message={form.formState.errors.metadata?.city?.message} />
            </label>
            <label className={styles.field}>
              <Caption>Country</Caption>
              <Controller
                control={form.control}
                name="metadata.country"
                render={({ field }) => (
                  <SubmissionCombobox
                    mode="strict"
                    label="Country"
                    placeholder={dbError ? "Couldn't load countries" : "Select country"}
                    items={countryItems}
                    value={field.value}
                    onChange={onCountryChange}
                    onBlur={field.onBlur}
                    disabled={listDisabled}
                  />
                )}
              />
              <FieldError message={form.formState.errors.metadata?.country?.message} />
            </label>
          </div>
          <label className={styles.field}>
            <Caption>Google Maps URL</Caption>
            <Input
              placeholder={mapPlaceholder(name, mapCity, mapCountry)}
              {...form.register("metadata.google_maps_url")}
            />
            <FieldError message={form.formState.errors.metadata?.google_maps_url?.message} />
          </label>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <Caption>Latitude</Caption>
              <Input
                type="number"
                step="any"
                placeholder="48.9242"
                {...form.register("metadata.latitude", { valueAsNumber: true })}
              />
              <FieldError message={form.formState.errors.metadata?.latitude?.message} />
            </label>
            <label className={styles.field}>
              <Caption>Longitude</Caption>
              <Input
                type="number"
                step="any"
                placeholder="2.0301"
                {...form.register("metadata.longitude", { valueAsNumber: true })}
              />
              <FieldError message={form.formState.errors.metadata?.longitude?.message} />
            </label>
          </div>
          <div className={styles.help}>
            <Info size={14} />
            <Caption>
              Use the map to locate the exact spot. <br />
              Or right click the exact spot on Google Map, and paste the lat, lng here.
            </Caption>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <Body1 className={styles.sectionTitle}>Photos</Body1>
        <PhotoUploader form={form} />
      </section>

      <section className={styles.section}>
        <Body1 className={styles.sectionTitle}>Notes</Body1>
        {form.formState.errors.notes && <FieldError message="Each note must not be empty." />}
        <NoteEditor form={form} />
      </section>

      <section className={styles.section}>
        <Body1 className={styles.sectionTitle}>Links</Body1>
        {form.formState.errors.links && <FieldError message="Each link needs a valid URL." />}
        <LinkEditor form={form} />
      </section>
    </div>
  )
}

function mapPlaceholder(name: string, city: string, country: string): string {
  if (name && city && country) return buildGoogleMapsUrl({ name, city, country })
  return "Auto-filled from name, city, country"
}
