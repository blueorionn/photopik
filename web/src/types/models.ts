export interface Architecture {
  input_modalities: string[]
  output_modalities: string[]
}

export interface EnumParameter {
  type: 'enum'
  values: (string | number)[]
}

export interface RangeParameter {
  type: 'range'
  min: number
  max: number
}

export interface BooleanParameter {
  type: 'boolean'
}

export type SupportedParameter =
  EnumParameter | RangeParameter | BooleanParameter

export interface ImageModel {
  id: string
  name: string
  description: string
  created: number
  architecture: Architecture
  supported_parameters: Record<string, SupportedParameter>
  supports_streaming: boolean
  endpoints: string
}
