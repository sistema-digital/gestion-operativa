import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CrearSolicitudCompraStepObservaciones from './CrearSolicitudCompraStepObservaciones.vue';

describe('CrearSolicitudCompraStepObservaciones', () => {
  it('muestra chips de equipos y contextos con su estado visual', () => {
    const wrapper = mount(CrearSolicitudCompraStepObservaciones, {
      props: {
        observacion: 'Para uso en: 422006',
        solicitarUrgente: false,
        motivoUrgencia: '',
        equipos: [
          {
            id: 1,
            source: 'equipo',
            codEquipo: '422006',
            label: '422006 · Tractor',
            modelo: '6155M',
            marca: 'John Deere',
            tipo: 'Tractor',
          },
          {
            id: 2,
            source: 'equipo',
            codEquipo: '422018',
            label: '422018 · Cosechadora',
            modelo: 'S670',
            marca: 'John Deere',
            tipo: 'Cosechadora',
          },
          {
            id: 3,
            source: 'contexto',
            codEquipo: 'taller',
            label: 'Instalaciones de taller',
            modelo: null,
            marca: null,
            tipo: null,
          },
        ],
      },
    });

    const references = wrapper.text();
    const textarea = wrapper.get('textarea');

    expect(references).toContain('422006');
    expect(references).toContain('422018');
    expect(references).toContain('Instalaciones de taller');
    expect(wrapper.html()).toContain('emerald');
    expect(wrapper.html()).toContain('rose');
    expect(textarea.attributes('maxlength')).toBe('250');
    expect(references).toContain('19/250');
  });
});
