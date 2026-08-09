export enum DeviceStatus {
  READY_FOR_HANDOVER = 'ready_for_handover', // Sẵn sàng bàn giao
  HANDED_OVER = 'handed_over',               // Đã bàn giao
  IN_USE = 'in_use',                         // Đang sử dụng
  BROKEN = 'broken',                         // Đã hỏng
  LIQUIDATED = 'liquidated'                  // Đã thanh lý
}

export interface DeviceStatusOption {
  value: DeviceStatus;
  label: string;
  type: 'success' | 'primary' | 'info' | 'warning' | 'danger';
}

export const DEVICE_STATUS_OPTIONS: DeviceStatusOption[] = [
  { value: DeviceStatus.READY_FOR_HANDOVER, label: 'Sẵn sàng bàn giao', type: 'success' },
  { value: DeviceStatus.HANDED_OVER, label: 'Đã bàn giao', type: 'primary' },
  { value: DeviceStatus.IN_USE, label: 'Đang sử dụng', type: 'info' },
  { value: DeviceStatus.BROKEN, label: 'Đã hỏng', type: 'danger' },
  { value: DeviceStatus.LIQUIDATED, label: 'Đã thanh lý', type: 'warning' }
];

/**
 * Standardize any raw status string (including legacy values like 'available', 'assigned', 'maintenance')
 * to one of the 5 main refactored DeviceStatus values.
 */
export function normalizeDeviceStatus(status: string | null | undefined): DeviceStatus {
  if (!status) return DeviceStatus.READY_FOR_HANDOVER;
  const s = String(status).trim().toLowerCase();

  switch (s) {
    case 'ready_for_handover':
    case 'available':
      return DeviceStatus.READY_FOR_HANDOVER;

    case 'handed_over':
    case 'assigned':
      return DeviceStatus.HANDED_OVER;

    case 'in_use':
    case 'using':
    case 'active':
    case 'activity':
      return DeviceStatus.IN_USE;

    case 'broken':
    case 'maintenance':
    case 'damaged':
      return DeviceStatus.BROKEN;

    case 'liquidated':
    case 'disposed':
    case 'archived':
      return DeviceStatus.LIQUIDATED;

    default:
      return DeviceStatus.READY_FOR_HANDOVER;
  }
}

/**
 * Get Vietnamese display label for a status string
 */
export function getDeviceStatusLabel(status: string | null | undefined): string {
  const norm = normalizeDeviceStatus(status);
  const found = DEVICE_STATUS_OPTIONS.find(opt => opt.value === norm);
  return found ? found.label : 'Sẵn sàng bàn giao';
}

/**
 * Get Element Plus tag type for a status string
 */
export function getDeviceStatusTagType(status: string | null | undefined): 'success' | 'primary' | 'info' | 'warning' | 'danger' {
  const norm = normalizeDeviceStatus(status);
  const found = DEVICE_STATUS_OPTIONS.find(opt => opt.value === norm);
  return found ? found.type : 'success';
}

/**
 * Validation check if a device is ready for handover
 */
export function isReadyForHandover(status: string | null | undefined): boolean {
  const norm = normalizeDeviceStatus(status);
  return norm === DeviceStatus.READY_FOR_HANDOVER;
}

/**
 * Validation check if a device is currently handed over or in use so it can be returned/recalled
 */
export function isHandedOverOrInUse(status: string | null | undefined): boolean {
  const norm = normalizeDeviceStatus(status);
  return norm === DeviceStatus.HANDED_OVER || norm === DeviceStatus.IN_USE;
}
