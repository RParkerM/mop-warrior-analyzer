import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { HasteUtils } from 'src/app/report/models/haste';
import { ISettings, Settings } from 'src/app/settings';

function data(params: Partial<IItemData> = {}): IItemData {
  return Object.assign({}, Item.DEFAULTS, params) as IItemData;
}

export class Item {
  public static readonly DEFAULTS: Partial<IItemData> = {
    itemId: 0
  };

  public static baseData(id: number) {
    return Item.dataByItemId[id];
  }

  public static get(id: number): IItemData {
    const data = Item.dataByItemId[id];

    return data;
  }

  public static fromDamageId(id: number): IItemData | undefined {
    if (this.dataByItemId.hasOwnProperty(id)) {
      return this.dataByItemId[id];
    }

    return Object.values(this.data).find((item) => item.itemId == id);//spell.damageIds.includes(id));
  }

  public static data: { [itemId: number]: IItemData } = {

  }

  public static dataByItemId: { [spellId: number]: IItemData } =
    Object.keys(Item.data).reduce((lookup, next) => {
      const itemId = parseInt(next),
        data: IItemData = Item.data[itemId];

      data.itemId = itemId;
      lookup[itemId] = data;

      return lookup;
    }, {} as { [itemId: number]: IItemData });
}

export interface IItemData {
  itemId: number
}

export interface IGearInfo {
  id: number,
  // quality: number,
  // icon: string,
  // itemLevel: number,
  permanentEnchant?: number,
  gems?: Array<IGemInfo>
}

export interface IGemInfo {
  id: number,
  itemLevel?: number,
  icon?: string
}

// valourous
// 40472 -- hands
// 40473 -- helm
// 40493 -- legs
// 40471 -- chest
// 40494 -- shoulders

// heroes
// 39557 -- hands
// 39553 -- helm
// 39555 -- legs
// 39554 -- chest
// 39556 -- shoulders
