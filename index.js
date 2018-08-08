const scrapeIt = require("scrape-it")
const jsonfile = require('jsonfile')
const getJSON = require('get-json')

var heroFile = './json_output/heroes.json'

var heroes = {}
var counter = 0;
var heroesNumber = 0;

var specialBAT = {
  'dark_willow': 1.3,
  'juggernaut': 1.4,
  'oracle': 1.4,
  'anti-mage': 1.4,
  'troll_warlord': 1.45,
  'lone_druid': 1.5,
  'morphling': 1.5,
  'queen_of pain': 1.5,
  'terrorblade': 1.5,
  'windranger': 1.5,
  'huskar': 1.6,
  'lina': 1.6,
  'bristleback': 1.8,
  'magnus': 1.8,
  'sven': 1.8,
  'weaver': 1.8,
  'lifestealer': 1.85,
  'treant_protector': 1.9,
  'spirit_breaker': 1.9,
  'doom': 2
}

function getHeroes() {
    console.log("fetching basic hero info...")

    getJSON('https://api.opendota.com/api/heroStats', function(error, response){
        if(error) {
            console.log(error)
        } else {    
            response.forEach(function(hero) {
                let hero_name_string = hero.localized_name.replace(' ', '_').toLowerCase();
                // hero.localized_name.replace(' ', '_').toLowerCase()
                let hero_BAT = specialBAT[hero_name_string] ? specialBAT[hero_name_string] : 1.7
                 heroes[hero_name_string] = {
                    'name': hero.localized_name,
                    // 'link': 'http://www.dota2.com/hero/' + hero.name.substr("npc_dota_hero_".length),
                    // 'avatar': 'https://api.opendota.com' + hero.img,
                    'attribute': hero.primary_attr,
                    // 'roles': hero.roles,
                    // 'lore': '',
                    // 'strBase': hero.base_str,
                    // 'agiBase': hero.base_agi,
                    // 'intBase': hero.base_int,
                    // 'strGain': hero.str_gain,
                    // 'agiGain': hero.agi_gain,
                    // 'intGain': hero.int_gain,
                    'hp': hero.primary_attr === 'str' ? hero.base_health + (hero.base_str * 22.5) : hero.base_health + (hero.base_str * 18),
                    'mana': hero.primary_attr === 'int' ? hero.base_mana + (hero.base_int * 15) : hero.base_mana + (hero.base_int * 12),
                    // 'hpRegen': hero.base_health_regen,
                    // 'manaRegen': hero.base_mana_regen,
                    // 'damageMin': hero.base_attack_min,
                    // 'damageMax': hero.base_attack_max,
                    // 'armor': hero.base_armor,
                    // 'magicResistance': hero.base_mr,
                    // 'moveSpeed': hero.move_speed,
                    // 'attackRange': hero.attack_range,
                    'attackSpeed': hero.primary_attr === 'agi' ? 1 / ((((hero.base_agi * 1.25) + 100) * .01) / hero_BAT) : 1 / (((hero.base_agi + 100) * .01) / hero_BAT)
                    // 'skills': [],
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

            // scrapeTalents()
        }
    })
}

// function scrapeSkills(heroObj) {
//     let hero = heroObj

//     scrapeIt(hero.link, {
//         lore: '#bioInner',
//         skills: {
//             listItem: '.abilitiesInsetBoxInner'
//           , data: {    
//                 name: {
//                     selector: '.abilityHeaderRowDescription > h2'
//                 },
//                 description: {
//                     selector: '.abilityHeaderRowDescription > p'
//                 },
//                 icon: {
//                     selector: '.abilityIconHolder2 > img',
//                     attr: 'src',
//                     conv: url => url.substr(0,attr.indexOf('?')),
//                 },
//                 rightAttribute: {
//                     selector: 'div .abilityFooterBoxRight',
//                 },
//                 leftAttribute: {
//                     selector: 'div .abilityFooterBoxLeft',
//                 },
//                 cooldownmana: {
//                     listItem: '.cooldownMana > div',
//                 }
//             }
//         }
    
//     }).then(res => {
//         heroName = hero.name.replace(' ','_').toLowerCase()
//         // Clean Up
//         heroes[heroName].skills = res.skills.map((skill) => {
//             // Clean right attributes
//             skill.rightAttribute = skill.rightAttribute.split("\n")

//             // Clean left attribute
//             let lastChar = ' '

//             for(let i = 0; i < skill.leftAttribute.length; i++) {
                
//                 if(lastChar !== ' ' && skill.leftAttribute[i] !== ' ' && lastChar !== ',' && skill.leftAttribute[i] !== ',' && (lastChar === lastChar.toLowerCase() || parseInt(lastChar,10)) && skill.leftAttribute[i] === skill.leftAttribute[i].toUpperCase()) {
//                     skill.leftAttribute = skill.leftAttribute.substr(0,i) + "_" + skill.leftAttribute.substr(i)
//                     i++
//                 }

//                 lastChar = skill.leftAttribute[i]
//             }

//             skill.leftAttribute = skill.leftAttribute.split("_")

//             // Merge attribute
//             let attributes = skill.leftAttribute.concat(skill.rightAttribute).concat(skill.cooldownmana)

//             // Delete old attribute
//             delete skill.rightAttribute
//             delete skill.leftAttribute
//             delete skill.cooldownmana

//             skill.attributes = []

//             // Extract attribute
//             attributes.forEach((attr) => {
//                 attr = {
//                     name: attr.substr(0,attr.indexOf(':')).toUpperCase(),
//                     value: attr.substr(attr.indexOf(': ') + 2)
//                 }
//                 if(attr.name.length > 0 && attr.value.length > 0){
//                     skill.attributes.push(attr)
//                 }
                
//             })

//             return skill
//         })

//         heroes[heroName].lore = res.lore

//         delete  heroes[heroName].link

//         counter++
        
//         console.log(hero.name + ' ('+counter+'/'+heroesNumber+')')

//         if(counter === heroesNumber) {
//             console.log("writing file...")

//             // Write JSON
//             jsonfile.writeFile(heroFile, heroes,{spaces: 2}, function (err) {
//                 if(err) {
//                     console.error(err)
//                 } else {
//                     console.log("completed!")
//                 }
//             })
//         }
//     })
// }

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

// getHeroes()

getHeroes()