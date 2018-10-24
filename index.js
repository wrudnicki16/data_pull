const scrapeIt = require("scrape-it")
const jsonfile = require('jsonfile')
// const getJSON = require('get-json')
const fetchJSON = require('fetch-json');

var heroFile = './json_output/heroes.json'

var heroes = {}
var counter = 0;
var heroesNumber = 0;

function round2Dec(float) {
  return Number.parseFloat(float.toFixed(2));
}

function calcHP(hero) {
  if (hero.primary_attr === 'str') {
    return hero.base_health + (hero.base_str * 22.5);
  } else {
    return hero.base_health + (hero.base_str * 18);
  }
}

function calcMP(hero) {
  if (hero.primary_attr === 'int') {
    return hero.base_mana + (hero.base_int * 15);
  } else {
    return hero.base_mana + (hero.base_int * 12);
  }
}

function calcAtkTime(hero) {
  let speed;

  if (hero.primary_attr === 'agi') {
    speed = 1 / ((((hero.base_agi * 1.25) + 100) * .01) / hero.attack_rate);
  } else {
    speed = 1 / (((hero.base_agi + 100) * .01) / hero.attack_rate);
  }
  return round2Dec(speed);
}

function calcAtkPerSec(hero) { // already lvl 1, not base
  let speed;

  if (hero.primary_attr === 'agi') {
    speed = (((hero.base_agi * 1.25) + 100) * .01) / hero.attack_rate;
  } else {
    speed = ((hero.base_agi + 100) * .01) / hero.attack_rate;
  }
  return round2Dec(speed);
}

function damage(hero) {
  return Math.round((calcAtkMin(hero) + calcAtkMax(hero)) / 2);
}
function calcAtkMin(hero) {
  return hero[`base_${hero.primary_attr}`] + hero.base_attack_min;
}

function calcAtkMax(hero) {
  return hero[`base_${hero.primary_attr}`] + hero.base_attack_max;
}

function calcCreepDPS(hero, atk_per_sec) {
  return round2Dec(damage(hero) * atk_per_sec);
}


function calcArmor(hero) {
  if (hero.primary_attr === 'agi') {
    return round2Dec(hero.base_armor + (hero.base_agi * .2));
  } else {
    return round2Dec(hero.base_armor + (hero.base_agi * .16));
  }
}

function calcMoveSpeed(hero) {
  if (hero.primary_attr === 'agi') {
    return Math.round(hero.move_speed * (1 + (hero.base_agi * .00063)));
  } else {
    return Math.round(hero.move_speed * (1 + (hero.base_agi * .0005)));
  }
}

function calcManaGain(hero) {
  if (hero.primary_attr === "int") {
    return round2Dec(0.9 * (1 + hero.base_int * 0.018 * 1.25));
  } else {
    return round2Dec(0.9 * (1 + hero.base_int * 0.018));
  }
}

function calcSkillSpam(heroObj) {
  heroObj["skills"].forEach(skill => {
    let costs = skill["attributes"]["MANA COST"];
    let cds = skill["attributes"]["COOLDOWN"];
    let pool = heroObj["mana"];
    if (costs && cds) {
      cost = parseInt(costs.split('/')[0]);
      cd = parseInt(cds.split('/')[0]);
      let spamCount = round2Dec(pool / (cost - (heroObj["manaRegen"] * cd)));
      if (spamCount > 2 && spamCount < 40 && cd < 50) {
        let words = skill["name"].split(' ');
        heroObj["spam"].push(`${spamCount} ${words[words.length - 1]}`);
      }
    }
  });
}

function getHeroes() {
    console.log("fetching basic hero info...")

    fetchJSON.get('https://api.opendota.com/api/heroStats')
    .then(response => {
      let body = 
      response.forEach(function (hero) {
        let hero_name_string = hero.localized_name.replace(' ', '_').toLowerCase();
        let atk_per_sec = calcAtkPerSec(hero);
        heroes[hero_name_string] = {
          'name': hero.localized_name,
          'dmg': damage(hero),
          'damageMin': calcAtkMin(hero),
          'attackSpeed': calcAtkTime(hero),
          'creepDPS': calcCreepDPS(hero, atk_per_sec),
          'armor': calcArmor(hero),
          'attackRange': hero.attack_type === 'Ranged' ? hero.attack_range : "",
          'moveSpeed': calcMoveSpeed(hero),
          'projSpeed': hero.attack_type === 'Ranged' ? hero.projectile_speed : "",
          'agiGain': hero.agi_gain,
          'strGain': hero.str_gain,
          'intGain': hero.int_gain,
          'hpRegen': hero.base_health_regen > 1.5 ? hero.base_health_regen : "",
          'hp': calcHP(hero),
          'mana': calcMP(hero),
          'attackPerSec': atk_per_sec, // lvl 1
          'spam': [],
          "attribute": hero.primary_attr,
          'manaRegen': calcManaGain(hero),
          'skills': [],
          // 'avatar': 'https://api.opendota.com' + hero.img,
          'link': 'http://www.dota2.com/hero/' + hero.name.substr("npc_dota_hero_".length), // needed to scrape skills
          // 'BAT': hero.attack_rate !== 1.7 ? hero.attack_rate : "",
          // 'roles': hero.roles,
          // 'lore': '',
          // 'strBase': hero.base_str,
          // 'agiBase': hero.base_agi,
          // 'intBase': hero.base_int,
          // 'manaRegen': hero.base_mana_regen,
          // 'damageMax': hero.base_attack_max,
          // 'magicResistance': hero.base_mr,
          // 'talents': [[null,null],[null,null],[null,null],[null,null]]
        }

        heroesNumber++
      })

      jsonfile.writeFile(heroFile, heroes, {
        spaces: 2
      }, function (err) {
        if (err) {
          console.error(err)
        } else {
          console.log("completed!")
        }
      })

      Object.keys(heroes).forEach(heroName => {
        scrapeSkills(heroes[heroName]);
      })
      // scrapeTalents()
    })
    .catch(err => console.log(err));
}

function scrapeSkills(heroObj) {
    let hero = heroObj
    scrapeIt(hero.link, {
        lore: '#bioInner',
        skills: {
            listItem: '.abilitiesInsetBoxInner'
          , data: {    
                name: {
                    selector: '.abilityHeaderRowDescription > h2'
                },
                description: {
                    selector: '.abilityHeaderRowDescription > p'
                },
                icon: {
                    selector: '.abilityIconHolder2 > img',
                    attr: 'src',
                    conv: url => url.substr(0,attr.indexOf('?')),
                },
                rightAttribute: {
                    selector: 'div .abilityFooterBoxRight',
                },
                leftAttribute: {
                    selector: 'div .abilityFooterBoxLeft',
                },
                cooldownmana: {
                    listItem: '.cooldownMana > div',
                }
            }
        }
    
    }).then(res => {
        heroName = hero.name.replace(' ','_').toLowerCase()
        // Clean Up
        heroes[heroName].skills = res.skills.map((skill) => {
            // Clean right attributes
            skill.rightAttribute = skill.rightAttribute.split("\n")

            // Clean left attribute
            let lastChar = ' '

            for(let i = 0; i < skill.leftAttribute.length; i++) {
                
                if(lastChar !== ' ' && skill.leftAttribute[i] !== ' ' && lastChar !== ',' && skill.leftAttribute[i] !== ',' && (lastChar === lastChar.toLowerCase() || parseInt(lastChar,10)) && skill.leftAttribute[i] === skill.leftAttribute[i].toUpperCase()) {
                    skill.leftAttribute = skill.leftAttribute.substr(0,i) + "_" + skill.leftAttribute.substr(i)
                    i++
                }

                lastChar = skill.leftAttribute[i]
            }

            skill.leftAttribute = skill.leftAttribute.split("_")

            // Merge attribute
            let attributes = skill.leftAttribute.concat(skill.rightAttribute).concat(skill.cooldownmana)

            // Delete old attribute
            delete skill.rightAttribute
            delete skill.leftAttribute
            delete skill.cooldownmana

            skill.attributes = {};

            // Extract attribute
            attributes.forEach((attr) => {
              let name = attr.substr(0, attr.indexOf(':')).toUpperCase();
              let value = attr.substr(attr.indexOf(': ') + 2);
              if(name.length > 0 && value.length > 0){
                  skill.attributes[name] = value
              }
              
            })

            return skill
        })

        heroes[heroName].lore = res.lore

        delete  heroes[heroName].link

        counter++
        
        console.log(hero.name + ' ('+counter+'/'+heroesNumber+')')

        if(counter === heroesNumber) {
            console.log("writing file...")

            // Write JSON
            jsonfile.writeFile(heroFile, heroes,{spaces: 2}, function (err) {
                if(err) {
                    console.error(err)
                } else {
                    console.log("completed!")
                }
            })
        }

        calcSkillSpam(heroes[heroName]);
    })
}

// function scrapeTalents() {
//     console.log("fetching talents...")

//     scrapeIt('http://wiki.teamliquid.net/dota2/List_of_all_talents', {
//         heroOrder: {
//             listItem: 'div #toc > ul > li',
//         },
//         talents: {
//             listItem: 'table > tr > td',
//         }
//     }).then(res => {

//         // Clean up hero order
//         res.heroOrder = res.heroOrder.map((name) => {
//             return name.substr(name.indexOf(' ') + 1).replace(' ','_').toLowerCase()
//         })

//         // Clean up talents
//         for(let i = res.talents.length-1; i >= 0; i--) {
//             if(i%13 === 0 || (i%13 - 2)%3 === 0) {
//                 res.talents.splice(i,1)
//             }
//         }

//         for(let i = 0; i < res.heroOrder.length; i++) {
//             let startTalent = i*8
//             heroes[res.heroOrder[i]].talents = [[res.talents[startTalent+6],res.talents[startTalent+7]],[res.talents[startTalent+4],res.talents[startTalent+5]],[res.talents[startTalent+2],res.talents[startTalent+3]],[res.talents[startTalent],res.talents[startTalent+1]]]
//         }

//         console.log('fetching skills...')

//         Object.keys(heroes).forEach((heroName) => {
//             scrapeSkills(heroes[heroName])
//         })
//     })
// }

getHeroes()