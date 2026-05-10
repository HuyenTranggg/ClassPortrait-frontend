export function formatExcelTime(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  const num = Number(value);
  if (!isNaN(num) && num >= 0 && num < 1) {
    // Thời gian trong Excel (nếu format là decimal) là phần lẻ của 1 ngày (24 giờ)
    let totalSeconds = Math.round(num * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return String(value);
}
