import { compare } from '../../utils/condition.util.js'

const text = compare({
    inputType: "TEXT",
    operator: "STARTS_WITH", 
    targetValue: "hello", 
    actualValue: "HELLOW"
})

console.log("TEXT")