/** Mock balance, independently editable from domain behavior and narrative. */
export const DEFAULTS = Object.freeze({days:14,clubEnergy:4,outsideEnergy:2,openCost:1,assignCost:1,researchDays:2,editorialCapacity:3,packaging:0.04,romancePenalty:0.25,fatiguePerWork:10,recovery:12,jobPay:150,trainingCost:80,toolCost:220,giftCost:60});
export const CALENDAR = Object.freeze({daysPerWeek:7,schoolDays:5,publicationDay:4,minDays:14,maxDays:84});
export const LIMITS = Object.freeze({packaging:0.08,minRomancePenalty:0.2,maxRomancePenalty:0.3});
export const RESEARCH = Object.freeze({lifetime:10,toolBonus:1,synergyBonus:0.5,statScale:10,questDifficulty:7,stepCost:1,stepGrowth:0.1,stepFatigue:4,questAttraction:8});
export const PUBLICATION = Object.freeze({maxScore:100000,khueMultiplier:1.5,slots:4,reputationScale:10000,emptyLoss:2,pressure:5,grantFrequency:2,baseGrants:1,grantThreshold:30000});
export const PERSONAL = Object.freeze({initialMoney:300,jobFatigue:10,trainingGrowth:0.5,trainingFatigue:4,restRecovery:20,synergyEvents:2,dateBond:3,dateEvents:2,boostCost:50,boostEnergy:1,upgradeGrowth:0.5,betrayalBondLoss:2});
export const FATIGUE = Object.freeze({minimumEfficiency:0.65,divisor:250,cap:100});
export const SUMMARY = Object.freeze({max:100,teamArticlesPerWeek:2,khueWeight:0.4,teamWeight:0.6,branchThreshold:50,totalThreshold:60});
