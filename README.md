# YA ALMACEN ACTUALIZA BIEN
AHORA ES APLICAR LOGICA PARA ESTILOS DE DESCARTE TANTO EN ALMACEN COMO OPERATIVO
# DEBE ESTAR HABILITADO CANTIAD PERO TMABIEN DEBEM OSTRARSE INVENARIO

### ULTIMA VEZ QUE SE ACTUALIZO GEMINI
feat(compras): modulariza carga de solicitudes y prioridad operativa

Centraliza la obtención de datos de edición en stores tipados, agrega el módulo dbequipos/equiposolicitudes con service, types y store, y reemplaza las consultas directas desde EditarSolicitudCompra.\n\nTambién tipa initialData con SolicitudCompraInitialData, ajusta permisosForm a un contrato mínimo para los detalles y cambia la lógica de prioridad para usar prioridad_id: el check solo aparece para área operativa con prioridad 1 o 2, mientras que prioridad 3 muestra un badge rojo de urgente para cualquier usuario.\n\nSe agregan prompts de documentación para crear y modificar stores siguiendo separación entre tipos, services y Pinia.