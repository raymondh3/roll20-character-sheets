/* global generateRowID:false */
import { getSetItems, getSetRepeatingItems, ordinalSpellLevel, getIntValue, isUndefinedOrEmpty, setCritDamage, fromVOrFinalSetAttrs, lowercaseDamageTypes } from './utilities';
import { updateAttackToggle, updateSavingThrowToggle, updateDamageToggle, updateHealToggle, updateHigherLevelToggle } from './updateToggles';
import { TOGGLE_VARS } from './constants';

const updateSpellFromSRD = (v, finalSetAttrs, repeatingString) => {
  if (v[`${repeatingString}spell_level_from_srd`]) {
    finalSetAttrs[`${repeatingString}spell_level`] = ordinalSpellLevel(v[`${repeatingString}spell_level_from_srd`]);
    finalSetAttrs[`${repeatingString}spell_level_from_srd`] = '';
  }
  if (v[`${repeatingString}school_from_srd`]) {
    finalSetAttrs[`${repeatingString}school`] = v[`${repeatingString}school_from_srd`].toUpperCase();
    finalSetAttrs[`${repeatingString}school_from_srd`] = '';
  }
  if (v[`${repeatingString}casting_time_from_srd`]) {
    finalSetAttrs[`${repeatingString}casting_time`] = v[`${repeatingString}casting_time_from_srd`].trim().toUpperCase().replace(/\s/g, '_');
    finalSetAttrs[`${repeatingString}casting_time_from_srd`] = '';
  }
  if (v[`${repeatingString}components_from_srd`]) {
    finalSetAttrs[`${repeatingString}components`] = `COMPONENTS_${v[`${repeatingString}components_from_srd`].trim().toUpperCase().replace(/\s/g, '_')}`;
    finalSetAttrs[`${repeatingString}components_from_srd`] = '';
  }
  if (v[`${repeatingString}duration_from_srd`]) {
    let duration = '';
    if (v[`${repeatingString}duration_from_srd`].toLowerCase().indexOf('up to') !== -1) {
      duration += 'CONCENTRATION_';
    }
    duration += v[`${repeatingString}duration_from_srd`].trim().toUpperCase().replace(/\s/g, '_');
    finalSetAttrs[`${repeatingString}duration`] = duration;
    finalSetAttrs[`${repeatingString}duration_from_srd`] = '';
  }
  if (v[`${repeatingString}saving_throw_vs_ability_from_srd`]) {
    finalSetAttrs[`${repeatingString}saving_throw_vs_ability`] = v[`${repeatingString}saving_throw_vs_ability_from_srd`].toUpperCase();
    finalSetAttrs[`${repeatingString}saving_throw_vs_ability_from_srd`] = '';
  }
};
const updateSpellsFromSRD = () => {
  getSetItems('updateSpellsFromSRD', {
    collectionArray: ['spells_srd'],
    callback: (v, finalSetAttrs) => {
      const spells = v.spells_srd.split(', ');

      for (const spell of spells) {
        const repeatingString = `repeating_spell_${generateRowID()}_`;
        finalSetAttrs[`${repeatingString}name`] = spell;
        finalSetAttrs[`${repeatingString}toggle_details`] = 0;
      }
    },
  });
};
const updateSpell = (rowId) => {
  const collectionArray = ['is_npc', 'pb', 'finesse_mod', 'global_spell_attack_bonus', 'global_spell_damage_bonus', 'global_spell_dc_bonus', 'global_spell_heal_bonus', 'default_ability', 'caster_level', 'base_dc'];
  for (const ability of ABILITIES) {
    collectionArray.push(`${ability}_mod`);
  }
  getSetRepeatingItems('updateSpell', {
    repeatingItems: ['repeating_spell'],
    collectionArray,
    collectionArrayAddItems: ['name', 'school', 'spell_level', 'spell_level_from_srd', 'school_from_srd', 'casting_time', 'casting_time_from_srd', 'components', 'components_from_srd', 'concentration', 'duration', 'duration_from_srd', 'type', 'roll_toggle', 'to_hit', 'attack_formula', 'proficiency', 'attack_ability', 'attack_bonus', 'saving_throw_toggle', 'saving_throw_ability', 'saving_throw_vs_ability', 'saving_throw_vs_ability_from_srd', 'saving_throw_bonus', 'saving_throw_dc', 'damage_toggle', 'damage_formula', 'damage', 'damage_ability', 'damage_bonus', 'damage_type', 'damage_crit', 'second_damage_toggle', 'second_damage_formula', 'second_damage', 'second_damage_ability', 'second_damage_bonus', 'second_damage_type', 'second_damage_crit', 'damage_string', 'parsed', 'heal_toggle', 'heal', 'heal_ability', 'heal_bonus', 'heal_query_toggle', 'add_casting_modifier', 'add_second_casting_modifier', 'higher_level_toggle', 'higher_level_dice', 'higher_level_die', 'second_higher_level_dice', 'second_higher_level_die', 'higher_level_heal', 'ritual', 'ritual_output', 'materials', 'materials_show', 'extras_toggle', 'emote', 'freetext', 'freeform'],
    rowId,
    callback: (v, finalSetAttrs, ids, repeatingItem) => {
      for (const id of ids) {
        const repeatingString = `${repeatingItem}_${id}_`;

        updateSpellFromSRD(v, finalSetAttrs, repeatingString);

        if (v[`${repeatingString}spell_level`] === 'CANTRIP') {
          finalSetAttrs[`${repeatingString}is_prepared`] = 'on';
        }

        if (!isUndefined(fromVOrFinalSetAttrs(v, finalSetAttrs, `${repeatingString}duration`)) && fromVOrFinalSetAttrs(v, finalSetAttrs, `${repeatingString}duration`).indexOf('CONCENTRATION') !== -1) {
          finalSetAttrs[`${repeatingString}concentration`] = 'Yes';
        } else {
          finalSetAttrs[`${repeatingString}concentration`] = '';
        }
        if (v[`${repeatingString}ritual`] === 'Yes') {
          finalSetAttrs[`${repeatingString}ritual_output`] = '?{Cast as|Ritual,{{ritual=1&#125;&#125;|Spell,}';
        } else {
          finalSetAttrs[`${repeatingString}ritual_output`] = '';
        }
        if (!isUndefinedOrEmpty(v[`${repeatingString}materials`])) {
          finalSetAttrs[`${repeatingString}materials_show`] = 1;
        } else if (!isUndefinedOrEmpty(v[`${repeatingString}materials_show`])) {
          finalSetAttrs[`${repeatingString}materials_show`] = 0;
        }

        const attackOptions = {
          attackAbility: true,
          globalAttackBonus: v.global_spell_attack_bonus,
          type: 'spell',
        };
        updateAttackToggle(v, finalSetAttrs, repeatingString, attackOptions);

        const savingThrowOptions = {
          bonusDC: v.global_spell_dc_bonus,
        };
        updateSavingThrowToggle(v, finalSetAttrs, repeatingString, savingThrowOptions);

        const damageOptions = {
          globalDamageBonus: v.global_spell_damage_bonus,
          type: 'spell',
        };
        updateDamageToggle(v, finalSetAttrs, repeatingString, damageOptions);
        if (v.damage_type) {
          finalSetAttrs.damage_type = lowercaseDamageTypes(v.damage_type);
        }
        if (v.second_damage_type) {
          finalSetAttrs.second_damage_type = lowercaseDamageTypes(v.second_damage_type);
        }
        setCritDamage(v, finalSetAttrs, repeatingString);

        if (getIntValue(v.is_npc) === 1 && v.caster_level && v[`${repeatingString}damage`] && v[`${repeatingString}damage`].indexOf('@{level}') !== -1) {
          finalSetAttrs[`${repeatingString}damage`] = v[`${repeatingString}damage`].replace('@{level}', '@{caster_level}');
        }

        updateHealToggle(v, finalSetAttrs, repeatingString);

        updateHigherLevelToggle(v, finalSetAttrs, repeatingString);

        if (isUndefinedOrEmpty(v[`${repeatingString}extras_toggle`]) && (v[`${repeatingString}emote`] || v[`${repeatingString}freetext`] || v[`${repeatingString}freeform`])) {
          finalSetAttrs[`${repeatingString}extras_toggle`] = TOGGLE_VARS.extras;
        }
      }
    },
  });
};
const updateSpellSlots = () => {
  const collectionArray = ['caster_level', 'caster_type'];
  const spellSlots = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
  };
  for (const level in spellSlots) {
    if (spellSlots.hasOwnProperty(level)) {
      const repeatingString = `spell_slots_l${level}`;
      collectionArray.push(`${repeatingString}_calc`);
      collectionArray.push(`${repeatingString}_bonus`);
      collectionArray.push(`${repeatingString}_max`);
      collectionArray.push(`${repeatingString}_toggle`);
    }
  }

  getSetItems('updateSpellSlots', {
    collectionArray,
    callback: (v, finalSetAttrs) => {
      const casterLevel = getIntValue(v.caster_level);
      const casterType = v.caster_type;

      if (casterType === 'full') {
        if (casterLevel >= 3) {
          spellSlots[1] = 4;
        } else if (casterLevel === 2) {
          spellSlots[1] = 3;
        } else if (casterLevel === 1) {
          spellSlots[1] = 2;
        }
        if (casterLevel >= 4) {
          spellSlots[2] = 3;
        } else if (casterLevel === 3) {
          spellSlots[2] = 2;
        }
        if (casterLevel >= 6) {
          spellSlots[3] = 3;
        } else if (casterLevel === 5) {
          spellSlots[3] = 2;
        }
        if (casterLevel >= 9) {
          spellSlots[4] = 3;
        } else if (casterLevel === 8) {
          spellSlots[4] = 2;
        } else if (casterLevel === 7) {
          spellSlots[4] = 1;
        }
        if (casterLevel >= 18) {
          spellSlots[5] = 3;
        } else if (casterLevel >= 10) {
          spellSlots[5] = 2;
        } else if (casterLevel === 9) {
          spellSlots[5] = 1;
        }
        if (casterLevel >= 19) {
          spellSlots[6] = 2;
        } else if (casterLevel >= 11) {
          spellSlots[6] = 1;
        }
        if (casterLevel >= 20) {
          spellSlots[7] = 2;
        } else if (casterLevel >= 13) {
          spellSlots[7] = 1;
        }
        if (casterLevel >= 15) {
          spellSlots[8] = 1;
        }
        if (casterLevel >= 17) {
          spellSlots[9] = 1;
        }
      }

      if (casterType === 'half') {
        if (casterLevel >= 5) {
          spellSlots[1] = 4;
        } else if (casterLevel >= 3) {
          spellSlots[1] = 3;
        } else if (casterLevel === 2) {
          spellSlots[1] = 2;
        }
        if (casterLevel >= 7) {
          spellSlots[2] = 3;
        } else if (casterLevel >= 5) {
          spellSlots[2] = 2;
        }
        if (casterLevel >= 11) {
          spellSlots[3] = 3;
        } else if (casterLevel >= 9) {
          spellSlots[3] = 2;
        }
        if (casterLevel >= 17) {
          spellSlots[4] = 3;
        } else if (casterLevel >= 15) {
          spellSlots[4] = 2;
        } else if (casterLevel >= 13) {
          spellSlots[4] = 1;
        }
        if (casterLevel >= 19) {
          spellSlots[5] = 2;
        } else if (casterLevel >= 17) {
          spellSlots[5] = 1;
        }
      }

      if (casterType === 'third') {
        if (casterLevel >= 7) {
          spellSlots[1] = 4;
        } else if (casterLevel >= 4) {
          spellSlots[1] = 3;
        } else if (casterLevel === 3) {
          spellSlots[1] = 2;
        }
        if (casterLevel >= 10) {
          spellSlots[2] = 3;
        } else if (casterLevel >= 7) {
          spellSlots[2] = 2;
        }
        if (casterLevel >= 16) {
          spellSlots[3] = 3;
        } else if (casterLevel >= 13) {
          spellSlots[3] = 2;
        }
        if (casterLevel >= 19) {
          spellSlots[4] = 1;
        }
      }

      for (const level in spellSlots) {
        if (spellSlots.hasOwnProperty(level)) {
          const repeatingString = `spell_slots_l${level}`;
          finalSetAttrs[repeatingString] = 0;
          if (spellSlots[level] !== 0 || exists(v[`${repeatingString}_calc`])) {
            finalSetAttrs[`spell_slots_l${level}_calc`] = spellSlots[level];
          }

          const slots = v[`${repeatingString}`];
          const slotBonus = getIntValue(v[`${repeatingString}_bonus`]);
          const spellSlotMax = spellSlots[level] + slotBonus;

          if (spellSlotMax > 0) {
            finalSetAttrs[`${repeatingString}_max`] = spellSlotMax;
            if (isUndefinedOrEmpty(slots)) {
              finalSetAttrs[repeatingString] = spellSlotMax;
            }
          } else {
            if (exists(v[`${repeatingString}_max`])) {
              finalSetAttrs[`${repeatingString}_max`] = 0;
            }
          }
        }
      }
    },
  });
};
const updateSpellShowHide = () => {
  const collectionArray = ['spells_show_spell_level_if_all_slots_are_used'];
  for (let i = 0; i <= 9; i++) {
    collectionArray.push(`spell_slots_l${i}`);
    collectionArray.push(`spell_slots_l${i}_max`);
    collectionArray.push(`spell_slots_l${i}_toggle`);
    collectionArray.push(`spells_level_${i}_macro_var`);
    collectionArray.push(`spells_level_${i}_show`);
  }

  getSetItems('updateSpellShowHide', {
    collectionArray,
    callback: (v, finalSetAttrs) => {
      const showLevelIfAllSlotsAreUsed = isUndefinedOrEmpty(v.spells_show_spell_level_if_all_slots_are_used) || v.spells_show_spell_level_if_all_slots_are_used === 'on';

      for (let level = 0; level <= 9; level++) {
        if (v[`spells_level_${level}_macro_var`] || getIntValue(v[`spell_slots_l${level}`]) || getIntValue(v[`spell_slots_l${level}_max`])) {
          finalSetAttrs[`spell_slots_l${level}_toggle`] = 'on';
        } else {
          finalSetAttrs[`spell_slots_l${level}_toggle`] = 0;
        }

        const hasSlots = getIntValue(v[`spell_slots_l${level}`]);
        const hasSpells = v[`spells_level_${level}_macro_var`];

        if ((hasSlots || showLevelIfAllSlotsAreUsed) && (hasSlots || hasSpells)) {
          finalSetAttrs[`spells_level_${level}_show`] = true;
        } else {
          finalSetAttrs[`spells_level_${level}_show`] = '';
        }
      }
    },
  });
};
const watchForSpellChanges = () => {
  const spellsWatch = ['change:spells_show_spell_level_if_all_slots_are_used'];

  for (let i = 0; i <= 9; i++) {
    spellsWatch.push(`change:spells_level_${i}_macro_var`);
    spellsWatch.push(`change:spell_slots_l${i}`);
    spellsWatch.push(`change:spell_slots_l${i}_max`);
  }

  on(spellsWatch.join(' '), () => {
    updateSpellShowHide();
  });
};

const updateSpellChatMacro = () => {
  const spells = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
  };

  const collectionArray = ['spells_show_unprepared'];
  for (let i = 0; i <= 9; i++) {
    collectionArray.push(`spells_level_${0}_macro_var`);
  }
  getSetRepeatingItems('updateSpellChatMacro', {
    repeatingItems: ['repeating_spell'],
    collectionArray,
    collectionArrayAddItems: ['name', 'spell_level', 'is_prepared'],
    callback: (v, finalSetAttrs, ids, repeatingItem) => {
      for (const id of ids) {
        const repeatingString = `${repeatingItem}_${id}_`;
        const showUnprepared = v.spells_show_unprepared === 'on' || isUndefinedOrEmpty(v.spells_show_unprepared);
        const spellName = v[`${repeatingString}name`];
        const spellLevel = getIntValue(v[`${repeatingString}spell_level`], 0);
        const spellPrepared = v[`${repeatingString}is_prepared`] === 'on';

        if (spellName && spellPrepared) {
          spells[spellLevel].push(`[${spellName}](~repeating_spell_${id}_spell)`);
        } else if (spellName && showUnprepared) {
          spells[spellLevel].push(`<span class="sheet-unprepared">[${spellName}](~repeating_spell_${id}_spell)</span>`);
        }
      }

      for (let i = 0; i <= 9; i++) {
        if (spells[i].length > 0) {
          finalSetAttrs[`spells_level_${i}_macro_var`] = spells[i].join(', ');
        } else {
          finalSetAttrs[`spells_level_${i}_macro_var`] = '';
        }
      }
    },
  });
};

export { updateSpellFromSRD, updateSpellsFromSRD, updateSpell, updateSpellSlots, updateSpellShowHide, watchForSpellChanges, updateSpellChatMacro };
