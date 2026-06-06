export function selectBossCoreColor(armor: number, secondary: number, accent: number): number {
  const brightness = colorBrightness(armor);
  if (brightness > 210) {
    return secondary;
  }
  if (Math.abs(brightness - colorBrightness(accent)) < 24) {
    return 0xe8fbff;
  }
  return accent;
}

function colorBrightness(color: number): number {
  const red = (color >> 16) & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = color & 0xff;
  return red * 0.299 + green * 0.587 + blue * 0.114;
}
