import type { CardConfig } from "../contracts/types";
import { cloneCardConfig, emptyCardConfig } from "./card";
import {
  markSpannedCells,
  serializeGridOrder,
  sizeFitsAt,
  sizeFromToken,
  type SlotSizeMap,
} from "./grid";

export interface BackupUsedSlot {
  oldSlot: number;
  size: number;
}

export interface BackupOrderSlots {
  usedSlots: BackupUsedSlot[];
  seen: Record<string, boolean>;
}

export interface BackupButtonLayoutPlan {
  importedCount: number;
  buttons: CardConfig[];
  button_order: string;
  importedSizes: SlotSizeMap;
  slotMap: Record<string, number>;
}

export function backupOrderUsedSlots(
  order: string | null | undefined,
  importedCount: number,
): BackupOrderSlots {
  const parts = String(order || "").split(",");
  const usedSlots: BackupUsedSlot[] = [];
  const seen: Record<string, boolean> = {};
  for (const part of parts) {
    const token = part.trim();
    if (!token) continue;
    const lastCh = token.charAt(token.length - 1);
    const parsedSize = sizeFromToken(lastCh);
    const num = parseInt(token, 10);
    if (Number.isNaN(num) || num < 1 || num > importedCount || seen[String(num)]) continue;
    seen[String(num)] = true;
    usedSlots.push({ oldSlot: num, size: parsedSize });
  }
  return { usedSlots, seen };
}

export function backupPlaceSlotAt(
  grid: number[],
  slot: number,
  pos: number,
  size: number,
  maxSlots: number,
  gridCols: number,
): void {
  grid[pos] = slot;
  if (size > 1) {
    markSpannedCells(grid, pos, size, maxSlots, gridCols);
  }
}

export function planBackupButtonLayout(
  sourceButtons: readonly Partial<CardConfig>[],
  buttonOrder: string | null | undefined,
  targetSlots: number,
  gridCols: number,
): BackupButtonLayoutPlan {
  const importedCount = sourceButtons.length;
  const buttons: CardConfig[] = [];
  const importedSizes: SlotSizeMap = {};
  const slotMap: Record<string, number> = {};
  let orderStr = "";

  if (importedCount !== targetSlots) {
    const orderInfo = backupOrderUsedSlots(buttonOrder, importedCount);
    const usedSlots = orderInfo.usedSlots;
    const seen = orderInfo.seen;
    for (let j = 0; j < importedCount; j += 1) {
      const slotNum = j + 1;
      if (seen[String(slotNum)]) continue;
      const button = sourceButtons[j] || emptyCardConfig();
      if (button.entity || button.label || button.type) {
        usedSlots.push({ oldSlot: slotNum, size: 1 });
      }
    }

    const limit = Math.min(usedSlots.length, targetSlots);
    for (let u = 0; u < limit; u += 1) {
      const newSlot = u + 1;
      const used = usedSlots[u];
      if (!used) continue;
      slotMap[String(used.oldSlot)] = newSlot;
      buttons.push(cloneCardConfig(sourceButtons[used.oldSlot - 1] || emptyCardConfig()));
      if (used.size > 1) importedSizes[String(newSlot)] = used.size;
    }
    for (let fill = limit; fill < targetSlots; fill += 1) {
      buttons.push(emptyCardConfig());
    }

    const newGrid = Array<number>(targetSlots).fill(0);
    let pos = 0;
    for (let p = 0; p < limit && pos < targetSlots; p += 1) {
      const newSlot = p + 1;
      let targetSize = importedSizes[String(newSlot)] || 1;
      if (!sizeFitsAt(pos, targetSize, targetSlots, gridCols)) {
        targetSize = 1;
        delete importedSizes[String(newSlot)];
      }
      backupPlaceSlotAt(newGrid, newSlot, pos, targetSize, targetSlots, gridCols);
      pos += 1;
      while (pos < targetSlots && newGrid[pos] === -1) pos += 1;
    }
    orderStr = serializeGridOrder(newGrid, importedSizes);
  } else {
    for (let i = 0; i < targetSlots; i += 1) {
      buttons.push(cloneCardConfig(i < importedCount ? sourceButtons[i] : emptyCardConfig()));
      slotMap[String(i + 1)] = i + 1;
    }
    orderStr = String(buttonOrder || "");
  }

  return {
    importedCount,
    buttons,
    button_order: orderStr,
    importedSizes,
    slotMap,
  };
}
