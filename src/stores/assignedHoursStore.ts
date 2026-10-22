import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/lib/supabase"; // Maintenance DB
import type { AssignedHoursWorkOrder } from "./assignedHoursStore.types";

export const useAssignedHoursStore = defineStore("assignedHours", () => {
  // Cache structure: { [area_date_key]: data[] }
  // Example key: "Cosecha Agricola_2026-04-21"
  const cache = ref<Record<string, AssignedHoursWorkOrder[]>>({});
  const areaCache = ref<Record<string, string>>({}); // email -> area

  const normalizeEmail = (email: string): string => email.trim().toLowerCase();

  const hasCachedSupervisorArea = (email: string): boolean => {
    const normalizedEmail = normalizeEmail(email);

    return (
      normalizedEmail.length > 0 &&
      Object.hasOwn(areaCache.value, normalizedEmail)
    );
  };

  const getSupervisorArea = (email: string): string => {
    const normalizedEmail = normalizeEmail(email);

    return areaCache.value[normalizedEmail] || "";
  };

  const fetchSupervisorAreas = async (
    emails: string[],
    force = false,
  ): Promise<Record<string, string>> => {
    const normalizedEmails = Array.from(
      new Set(emails.map(normalizeEmail).filter((email) => email.length > 0)),
    );
    const emailsToFetch = force
      ? normalizedEmails
      : normalizedEmails.filter((email) => !hasCachedSupervisorArea(email));

    if (emailsToFetch.length > 0) {
      const { data, error } = await supabase
        .from("PROFILE")
        .select("email, area")
        .in("email", emailsToFetch);

      if (error) {
        console.error("Error fetching supervisor areas:", error);
      } else {
        const profiles = data || [];

        profiles.forEach((profile) => {
          const profileEmail = normalizeEmail(profile.email || "");

          if (profileEmail) {
            areaCache.value[profileEmail] = profile.area || "";
          }
        });

        emailsToFetch.forEach((email) => {
          if (!hasCachedSupervisorArea(email)) {
            areaCache.value[email] = "";
          }
        });
      }
    }

    return normalizedEmails.reduce<Record<string, string>>((areas, email) => {
      areas[email] = getSupervisorArea(email);
      return areas;
    }, {});
  };

  const fetchSupervisorArea = async (
    email: string,
    force = false,
  ): Promise<string> => {
    if (!email) return "";

    await fetchSupervisorAreas([email], force);
    return getSupervisorArea(email);
  };

  const fetchHours = async (
    area: string,
    date: string,
    force = false,
  ): Promise<AssignedHoursWorkOrder[]> => {
    if (!area || !date) return [];

    const cacheKey = `${area}_${date}`;
    if (cache.value[cacheKey] && !force) {
      return cache.value[cacheKey];
    }

    try {
      const summarySelect = `
          ID_OT,
          id_om,
          created,
          id_sg,
          Fecha,
          "Duración (horas)",
          Estatus,
          "Retraso (horas)",
          Semana,
          MECANICOS!ORDEN_TRABAJO_ID_Mecanico_fkey (
            id,
            NOMBRE,
            AREA,
            "EQUIPO DE TRABAJO"
          ),
          ORDEN_MANTENIMIENTO!ot_id_om_fkey (
            "Área",
            "Descripcion"
          ),
          OM_SG!OT_id_sg_fkey (
            id_sg,
            tipo_trabajo,
            ORDEN_MANTENIMIENTO!om_servicios_generales_id_orden_base_fkey (
              "Área",
              "Descripcion"
            )
          )
        `;

      const response = await supabase
        .from("ORDEN_TRABAJO")
        .select(summarySelect)
        .eq("Fecha", date)
        .overrideTypes<AssignedHoursWorkOrder[], { merge: false }>();

      if (response.error) throw response.error;
      const data = response.data || [];

      const filtered = data.filter((row) => {
        if (area === "Servicios Generales") {
          // "USA ID_SG" para Servicios Generales
          return row.id_sg != null;
        } else {
          // "PARA LAS OTRAS AREA USADA ID_OM" y asegurarse que no sea SG
          return (
            row.id_om != null &&
            row.id_sg == null &&
            row.ORDEN_MANTENIMIENTO?.["Área"] === area
          );
        }
      });

      cache.value[cacheKey] = filtered;
      return filtered;
    } catch (err) {
      console.error("Error fetching assigned hours:", err);
      return [];
    }
  };

  return {
    cache,
    areaCache,
    fetchSupervisorArea,
    fetchSupervisorAreas,
    getSupervisorArea,
    fetchHours,
  };
});
