import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabaseCompras, supabaseEquipos } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import type { SolicitudCompraInitialData } from '@/views/compras/type'
import { getAccessLevelsOperativoSolicitud } from './permisosOEditarSolicitud'
import type { DetalleSolicitud } from '@/types'

export interface DetalleEditable {
  ui_id: string
  db_id: string | null
  isManual: boolean
  cod_producto: string | null
  descripcion: string
  producto: any | null
  detalleSolicitud: DetalleSolicitud | null
  unidad_id: string
  unidad: string | null
  cantidad: number | null
  cantidad_inventario: number | null
  cantidad_gerencia: number | null
  cantidad_subida_sistema_compra: number | null
  estatus_detalle: number | null
}

export interface SolicitudEditableFormProps {
  mode?: string
  initialData?: SolicitudCompraInitialData | null
}

export type SolicitudEditableFormEmit = (
  event: 'close' | 'submit',
  payload?: unknown
) => void

export function useSolicitudCompraEditableForm(
  props: SolicitudEditableFormProps,
  emit: SolicitudEditableFormEmit
) {
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()


  const fechaEntrega = ref('')
  const observacion = ref('')
  const prioridadSolicitada = ref(false)

  const userEmail = ref('')
  const userName = ref('')

  const selectedEquipos = ref<{ cod_equipo: string }[]>([])
  const allEquipos = ref<any[]>([])
  const searchEquipo = ref('')
  const showEquiposDropdown = ref(false)

  const searchProducto = ref('')
  const showProductosDropdown = ref(false)
  const productosResult = ref<any[]>([])
  const isSearchingProductos = ref(false)
  const hasMoreProductos = ref(false)
  const productosOffset = ref(0)

  const unidadesMedida = ref<{ id: string | number; abreviatura: string }[]>([])

  const detalles = ref<DetalleEditable[]>([])
  const showConfirmCancel = ref(false)
  const initialFormSignature = ref('')

  let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null
  let isNavigationAllowed = false
  let pendingRouteTarget: any = null

  const isEditMode = computed(() => props.mode === 'edit' || Boolean(props.initialData))

  const title = computed(() => {
    return isEditMode.value ? 'Editar Solicitud' : 'Nueva Solicitud'
  })

  const filteredEquipos = computed(() => {
    if (!searchEquipo.value) return allEquipos.value.slice(0, 20)

    const q = searchEquipo.value.toLowerCase()

    return allEquipos.value
      .filter(e => String(e.cod_equipo).toLowerCase().includes(q))
      .slice(0, 20)
  })

  const getInitialPrioridadSolicitada = () => {
    return Number(props.initialData?.prioridad_id) === 2
  }

  const normalizeText = (value: unknown) => String(value ?? '').trim()

  const normalizeNumber = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null

    const numericValue = Number(value)

    return Number.isNaN(numericValue) ? null : numericValue
  }

  const buildFormSignature = () => {
    return JSON.stringify({
      fechaEntrega: normalizeText(fechaEntrega.value),
      observacion: normalizeText(observacion.value),
      prioridadSolicitada: Boolean(prioridadSolicitada.value),
      userEmail: normalizeText(userEmail.value),
      userName: normalizeText(userName.value),
      equipos: selectedEquipos.value
        .map(e => normalizeText(e.cod_equipo))
        .filter(Boolean)
        .sort(),
      detalles: detalles.value.map(d => ({
        db_id: normalizeText(d.db_id),
        isManual: Boolean(d.isManual),
        cod_producto: normalizeText(d.cod_producto),
        descripcion: normalizeText(d.descripcion),
        unidad_id: normalizeText(d.unidad_id),
        unidad: normalizeText(d.unidad),
        cantidad: normalizeNumber(d.cantidad),
        cantidad_inventario: normalizeNumber(d.cantidad_inventario),
        cantidad_gerencia: normalizeNumber(d.cantidad_gerencia),
        cantidad_subida_sistema_compra: normalizeNumber(d.cantidad_subida_sistema_compra),
        estatus_detalle: normalizeNumber(d.estatus_detalle)
      }))
    })
  }

  const hasUnsavedChanges = computed(() => {
    if (isEditMode.value && props.initialData) {
      return initialFormSignature.value !== '' &&
        buildFormSignature() !== initialFormSignature.value
    }

    return (
      fechaEntrega.value !== '' ||
      observacion.value !== '' ||
      prioridadSolicitada.value ||
      selectedEquipos.value.length > 0 ||
      detalles.value.length > 0
    )
  })

  const checkNavigation = (to: any, next: any) => {
    if (isNavigationAllowed) {
      next()
      return
    }

    if (hasUnsavedChanges.value) {
      showConfirmCancel.value = true
      pendingRouteTarget = to
      next(false)
      return
    }

    next()
  }

  const closeForm = () => {
    isNavigationAllowed = true
    emit('close')
  }

  const handleBack = () => {
    if (hasUnsavedChanges.value) {
      showConfirmCancel.value = true
      pendingRouteTarget = route.params.id ? `/compras/${route.params.id}` : '/compras'
      return
    }

    closeForm()
  }

  const handleCancelBtn = () => {
    if (hasUnsavedChanges.value) {
      showConfirmCancel.value = true
      pendingRouteTarget = '/compras'
      return
    }

    isNavigationAllowed = true
    router.push('/compras')
  }

  const confirmCancel = () => {
    showConfirmCancel.value = false
    isNavigationAllowed = true

    if (pendingRouteTarget) {
      router.push(pendingRouteTarget)
      return
    }

    closeForm()
  }

  const closeConfirm = () => {
    showConfirmCancel.value = false
  }

  const getCantidadAccessLevel = (detalle: DetalleEditable) => {

    return getAccessLevelsOperativoSolicitud().Cantidad({
      estatusSolicitud: Number(props.initialData?.estado_id ?? 0),
      area: userStore.getArea(),
      detalle: {
        cantidad: detalle.cantidad,
        cantidad_inventario: detalle.cantidad_inventario,
        producto: detalle.producto,
        activo: detalle.detalleSolicitud?.producto.activo
      }
    })
  }

  const getCantidadInventarioAccessLevel = (detalle: DetalleEditable) => {
    return getAccessLevelsOperativoSolicitud().CantidadInventario({
      area: userStore.getArea(),
      detalle: {
        cantidad_inventario: detalle.cantidad_inventario,
        producto: detalle.producto,
        activo: detalle.detalleSolicitud?.producto.activo
      }
    })
  }

  const getCantidadGerenciaAccessLevel = (detalle: DetalleEditable) => {
    return getAccessLevelsOperativoSolicitud().CantidadGerencia({
      area: userStore.getArea(),
      detalle: {
        cantidad_gerencia: detalle.cantidad_gerencia,
        producto: detalle.producto,
        activo: detalle.detalleSolicitud?.producto.activo
      }
    })
  }

  const getCantidadSistemaAccessLevel = (detalle: DetalleEditable) => {
    return getAccessLevelsOperativoSolicitud().CantidadSistema({
      area: userStore.getArea(),
      detalle: {
        cantidad_sistema: detalle.cantidad_subida_sistema_compra,
        producto: detalle.producto,
        activo: detalle.detalleSolicitud?.producto.activo
      }
    })
  }

  const getCodProductoAccessLevel = (detalle: DetalleEditable) => {
    return getAccessLevelsOperativoSolicitud().CodProducto({
      area: userStore.getArea(),
      detalle: {
        isManual: detalle.isManual,
        cod_producto: detalle.cod_producto
      }
    })
  }

  const getDescripcionAccessLevel = (detalle: DetalleEditable) => {
    return getAccessLevelsOperativoSolicitud().Descripcion({
      area: userStore.getArea(),
      detalle: {
        isManual: detalle.isManual,
        cod_producto: detalle.cod_producto,
      }
    })
  } 

  const getUnidadAccessLevel = (detalle:DetalleEditable)=>{
    return getAccessLevelsOperativoSolicitud().Unidad({
      area: userStore.getArea(),
      detalle: {
        isManual: detalle.isManual,
        cod_producto: detalle.cod_producto,
      }
    })
  }
  
  const getColCantidadInventarioAccessLevel = (detalles: DetalleEditable[]) => {
    return getAccessLevelsOperativoSolicitud().ColCantidadInventario({
      area: userStore.getArea(),
      detalle: detalles.map(detalle => ({
        cantidad: detalle.cantidad,
        cantidad_inventario: detalle.cantidad_inventario,
        producto: detalle.producto,
        activo: detalle.detalleSolicitud?.producto.activo
      }))
    })
  }

  const getColCantidadAccessLevel = (detalles: DetalleEditable[]) => {
    return getAccessLevelsOperativoSolicitud().ColCantidad({
      area: userStore.getArea(),
      detalle: detalles.map(detalle => ({
        cantidad: detalle.cantidad,
        cantidad_inventario: detalle.cantidad_inventario,
        producto: detalle.producto,
        activo: detalle.detalleSolicitud?.producto.activo
      }))
    })
  }

  const getColCantidadGerenciaAccessLevel = (detalles: DetalleEditable[]) => {
    return getAccessLevelsOperativoSolicitud().ColCantidadGerencia({
      area: userStore.getArea(),
      detalle: detalles.map(detalle => ({
        cantidad: detalle.cantidad,
        cantidad_gerencia: detalle.cantidad_gerencia,
        producto: detalle.producto,
        activo: detalle.detalleSolicitud?.producto.activo
      }))
    })
  }


  const normalizeDetalle = (d: any): DetalleEditable => {
    const codProducto = d.cod_producto ? String(d.cod_producto) : null

    const isManual =
      !codProducto ||
      codProducto.trim().toUpperCase().startsWith('MNL-')

    const unidadIdRaw =
      d.unidad_id ??
      d.unidad_medida_id ??
      d.producto?.unidad_medida?.id ??
      d.unidad_medida?.id ??
      null

    const unidadAbreviatura =
      d.unidad_medida?.abreviatura ??
      d.producto?.unidad_medida?.abreviatura ??
      d.unidad ??
      d.unidad_abreviatura ??
      null

    let unidadIdFinal = ''

    if (unidadIdRaw !== null && unidadIdRaw !== undefined) {
      unidadIdFinal = String(unidadIdRaw)
    } else if (unidadAbreviatura) {
      const unidadEncontrada = unidadesMedida.value.find(
        u =>
          String(u.abreviatura).trim().toUpperCase() ===
          String(unidadAbreviatura).trim().toUpperCase()
      )

      unidadIdFinal = unidadEncontrada ? String(unidadEncontrada.id) : ''
    }

    return {
      ui_id: d.id ? String(d.id) : crypto.randomUUID(),
      db_id: d.id ? String(d.id) : null,
      isManual,
      cod_producto: codProducto,
      descripcion: d.producto?.descripcion || d.descripcion || '',
      producto: d.producto ?? null,
      detalleSolicitud: d as DetalleSolicitud,
      unidad_id: unidadIdFinal,
      unidad: unidadAbreviatura,
      cantidad: d.cantidad ?? null,
      cantidad_inventario: d.cantidad_inventario ?? null,
      cantidad_gerencia: d.cantidad_gerencia ?? null,
      cantidad_subida_sistema_compra: d.cantidad_subida_sistema_compra ?? null,
      estatus_detalle: d.estatus_detalle ?? d.estatus_datalle ?? null
    }
  }

  const loadUser = async () => {
    if (isEditMode.value && props.initialData?.email) {
      userEmail.value = props.initialData.email
      userName.value =
        props.initialData.nombreSolicitante ||
        props.initialData.email.split('@')[0]

      return
    }

    await userStore.fetchCurrentUserProfile()

    userEmail.value = userStore.getEmail()
    userName.value = userStore.getNombre() || userEmail.value.split('@')[0]
  }

  const loadUnidades = async () => {
    const { data, error } = await supabaseCompras
      .from('unidad_medida')
      .select('id, abreviatura')
      .order('abreviatura')

    if (error) {
      console.error('Error cargando unidades de medida:', error)
      return
    }

    unidadesMedida.value = data || []
  }

  const loadEquipos = async () => {
    const { data, error } = await supabaseEquipos
      .from('equipos')
      .select('cod_equipo')
      .limit(200)

    if (error) {
      console.error('Error cargando equipos:', error)
      return
    }

    allEquipos.value = data || []
  }

  const hydrateForm = () => {
    if (!props.initialData) {
      fechaEntrega.value = ''
      observacion.value = ''
      prioridadSolicitada.value = false
      selectedEquipos.value = []
      detalles.value = []
      return
    }

    fechaEntrega.value = props.initialData.fecha_entrega || ''
    observacion.value = props.initialData.observacion || ''
    prioridadSolicitada.value = getInitialPrioridadSolicitada()

    selectedEquipos.value = props.initialData.equipos
      ? [...props.initialData.equipos]
      : []

    detalles.value = props.initialData.detalles
      ? props.initialData.detalles.map(normalizeDetalle)
      : []

    initialFormSignature.value = buildFormSignature()
  }

  const initForm = async () => {
    await loadUser()
    await loadUnidades()
    await loadEquipos()

    hydrateForm()
  }

  onMounted(initForm)

  watch(
    () => props.initialData,
    () => {
      hydrateForm()
    },
    { deep: true }
  )

  const toggleEquipo = (equipo: any) => {
    const index = selectedEquipos.value.findIndex(
      e => e.cod_equipo === equipo.cod_equipo
    )

    if (index > -1) {
      selectedEquipos.value.splice(index, 1)
    } else {
      selectedEquipos.value.push({
        cod_equipo: equipo.cod_equipo
      })
    }
  }

  const isEquipoSelected = (cod: string) => {
    return selectedEquipos.value.some(e => e.cod_equipo === cod)
  }

  const removeEquipo = (cod: string) => {
    selectedEquipos.value = selectedEquipos.value.filter(
      e => e.cod_equipo !== cod
    )
  }

  const performProductSearch = async (
    term: string,
    offset = 0,
    isLoadMore = false
  ) => {
    const cleanTerm = term.trim()

    if (cleanTerm.length < 4) {
      productosResult.value = []
      hasMoreProductos.value = false
      return
    }

    isSearchingProductos.value = true

    try {
      const { data, error } = await supabaseCompras
        .from('producto')
        .select(`
          id,
          cod_producto,
          descripcion,
          unidad_medida_id,
          unidad_medida (
            id,
            abreviatura
          )
        `)
        .or(`cod_producto.ilike.%${cleanTerm}%,descripcion.ilike.%${cleanTerm}%`)
        .order('descripcion', { ascending: true })
        .range(offset, offset + 29)

      if (error) throw error

      const items = data || []

      if (isLoadMore) {
        productosResult.value = [...productosResult.value, ...items]
      } else {
        productosResult.value = items
      }

      hasMoreProductos.value = items.length === 30
    } catch (err) {
      console.error('Error buscando productos:', err)
    } finally {
      isSearchingProductos.value = false
    }
  }

  watch(searchProducto, newVal => {
    if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout)

    if (newVal.trim().length < 4) {
      productosResult.value = []
      hasMoreProductos.value = false
      return
    }

    searchDebounceTimeout = setTimeout(() => {
      productosOffset.value = 0
      performProductSearch(newVal, 0, false)
    }, 400)
  })

  const loadMoreProducts = () => {
    productosOffset.value += 30
    performProductSearch(searchProducto.value, productosOffset.value, true)
  }

  const isProductoSelected = (cod: string) => {
    return detalles.value.some(d => d.cod_producto === cod && !d.isManual)
  }

  const toggleProducto = (prod: any) => {
    const index = detalles.value.findIndex(
      d => d.cod_producto === prod.cod_producto && !d.isManual
    )

    if (index > -1) {
      detalles.value.splice(index, 1)
      return
    }

    detalles.value.push({
      ui_id: crypto.randomUUID(),
      db_id: null,
      isManual: false,
      cod_producto: prod.cod_producto,
      descripcion: prod.descripcion,
      producto: prod ?? null,
      detalleSolicitud: null,
      unidad_id: prod.unidad_medida_id
        ? String(prod.unidad_medida_id)
        : prod.unidad_medida?.id
          ? String(prod.unidad_medida.id)
          : '',
      unidad: prod.unidad_medida?.abreviatura || null,
      cantidad: null,
      cantidad_inventario: null,
      cantidad_gerencia: null,
      cantidad_subida_sistema_compra: null,
      estatus_detalle: null
    })
  }

  const addManualItem = () => {
    detalles.value.push({
      ui_id: crypto.randomUUID(),
      db_id: null,
      isManual: true,
      cod_producto: null,
      descripcion: '',
      producto: null,
      detalleSolicitud: null,
      unidad_id: '',
      unidad: null,
      cantidad: null,
      cantidad_inventario: null,
      cantidad_gerencia: null,
      cantidad_subida_sistema_compra: null,
      estatus_detalle: null
    })
  }

  const removeDetalle = (uiId: string) => {
    detalles.value = detalles.value.filter(d => d.ui_id !== uiId)
  }

  const buildFormPayload = () => {
    return {
      solicitud: {
        id: props.initialData?.id ?? null,
        email: userEmail.value,
        fecha_entrega: fechaEntrega.value,
        observacion: observacion.value,
        prioridad_id: prioridadSolicitada.value ? 2 : 1
      },
      equipos: selectedEquipos.value.map(e => e.cod_equipo),
      detalles: detalles.value.map(d => ({
        db_id: d.db_id,
        isManual: d.isManual,
        cod_producto: d.cod_producto,
        descripcion: d.descripcion,
        unidad_id: d.unidad_id || null,
        cantidad: d.cantidad,
        cantidad_inventario: d.cantidad_inventario,
        cantidad_gerencia: d.cantidad_gerencia,
        cantidad_subida_sistema_compra: d.cantidad_subida_sistema_compra,
        estatus_detalle: d.estatus_detalle
      }))
    }
  }

  const submitForm = () => {
    isNavigationAllowed = true
    emit('submit', buildFormPayload())
  }

  return {
    fechaEntrega,
    observacion,
    prioridadSolicitada,

    userEmail,
    userName,

    selectedEquipos,
    allEquipos,
    searchEquipo,
    showEquiposDropdown,
    filteredEquipos,

    searchProducto,
    showProductosDropdown,
    productosResult,
    isSearchingProductos,
    hasMoreProductos,
    productosOffset,

    unidadesMedida,
    detalles,
    showConfirmCancel,

    title,
    hasUnsavedChanges,

    checkNavigation,
    closeForm,
    handleBack,
    handleCancelBtn,
    confirmCancel,
    closeConfirm,
    getCantidadAccessLevel,
    getCantidadInventarioAccessLevel,
    getCantidadGerenciaAccessLevel,
    getCantidadSistemaAccessLevel,
    getCodProductoAccessLevel,
    getDescripcionAccessLevel,
    getUnidadAccessLevel,
    getColCantidadAccessLevel,
    getColCantidadInventarioAccessLevel,
    getColCantidadGerenciaAccessLevel,
    toggleEquipo,
    isEquipoSelected,
    removeEquipo,

    performProductSearch,
    loadMoreProducts,
    isProductoSelected,
    toggleProducto,

    addManualItem,
    removeDetalle,

    buildFormPayload,
    submitForm
  }
}
