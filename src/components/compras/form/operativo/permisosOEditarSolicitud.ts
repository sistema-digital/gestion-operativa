

export enum AccessLevel {
    NONE = 0,
    READ = 1,
    EDIT = 2
}

export const areasOperativas:String[] =['COSECHA MECANIZADA','COSECHA AGRICOLA','ENGRASE','EQUIPO PESADO','MECANICA DE TRANSPORTE','SERVICIOS GENERALES'];
export const getAccessLevelsOperativoSolicitud = () => {

    const Cantidad = ({estatusSolicitud, area, detalle}: { estatusSolicitud: number; area: string; detalle?: {cantidad?: number|null, cantidad_inventario?: number|null,producto:string,activo?:boolean} }): AccessLevel => {
        
        const estatusEditable = [2,12,3,16];
        console.log(estatusSolicitud, area, detalle);
        

        const isAreaAndEstadoEditable:boolean= estatusEditable.includes(estatusSolicitud) && areasOperativas.includes(area.toUpperCase());
        
        const hasCantidadDetalle =detalle?.cantidad_inventario
                                    ?detalle.activo && detalle.cantidad_inventario! >= 0
                                    : false;
        if (isAreaAndEstadoEditable && hasCantidadDetalle) {
            return AccessLevel.EDIT
        } else if (detalle?.cantidad) {
            return AccessLevel.READ
        }
        

        return AccessLevel.NONE
    };

    const CantidadInventario = ({ area, detalle}: {area: string; detalle?: { cantidad_inventario?: number|null,producto:string,activo?:boolean} }): AccessLevel => {
        const isAreaReadable:boolean=  areasOperativas.includes(area.toUpperCase());
        
        const hasCantidadDetalle =detalle?.cantidad_inventario
                                    ?detalle.activo && detalle.cantidad_inventario! >= 0
                                    : false;
        if ( hasCantidadDetalle&& isAreaReadable) {
            return AccessLevel.READ
        } 
        

        return AccessLevel.NONE
    }

    const CantidadGerencia = ({ area, detalle}: {area: string; detalle?: { cantidad_gerencia?: number|null,producto:string,activo?:boolean} }): AccessLevel => {
        const isAreaReadable:boolean=  areasOperativas.includes(area.toUpperCase());
        
        const hasCantidadDetalle =detalle?.cantidad_gerencia
                                    ?detalle.activo && detalle.cantidad_gerencia! >= 0
                                    : false;
        if ( hasCantidadDetalle&& isAreaReadable) {
            return AccessLevel.READ
        } 
        

        return AccessLevel.NONE
    }

    return {
        Cantidad,
        CantidadInventario,
        CantidadGerencia
    }
}
