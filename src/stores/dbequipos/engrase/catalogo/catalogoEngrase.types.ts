export type CatalogoEngraseSection =
  "tipos-filtro" | "filtros" | "aceites" | "sistemas" | "subsistemas";

export type CatalogoEngraseRouteName =
  | "CatalogoEngraseTiposFiltro"
  | "CatalogoEngraseFiltros"
  | "CatalogoEngraseAceites"
  | "CatalogoEngraseSistemas"
  | "CatalogoEngraseSubsistemas";

export interface CatalogoEngraseNavigationItem {
  id: CatalogoEngraseSection;
  label: string;
  routeName: CatalogoEngraseRouteName;
}
