const {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLInt,
    GraphQLList,
    GraphQLString,
    GraphQLInputObjectType,
    GraphQLBoolean,
    GraphQLNonNull,
    graphql
} = require('graphql')


const Sequelize = require('sequelize')
const sequelize = new Sequelize('graphql_db','arief','arief',{
    operatorsAliases:false,
    dialect:'mysql'
})
const uniqid = require('uniqid')

const CarModel = sequelize.define('car',{
    car_id:{
        type:Sequelize.STRING,
        primaryKey:true
    },
    car_name:{
        type:Sequelize.STRING,
        allowNull:false
    }
},{
    timestamps:false,
    tableName:'car'
})

const PersonModel = sequelize.define('person',{
    person_id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    person_name:{
        type:Sequelize.STRING,
        allowNull:false
    },
    person_address:{
        type:Sequelize.STRING,
        allowNull:false
    }
},{
    timestamps:false,
    tableName:'person'
})

PersonModel.hasMany(CarModel, {
    foreignKey:'person_id'
})
CarModel.belongsTo(PersonModel,{
    foreignKey:'person_id'
})



const carType = new GraphQLObjectType({
    name:'Car',
    fields: () => ({
        id:{
            type:new GraphQLNonNull(GraphQLString)
        },
        name:{
            type:new GraphQLNonNull(GraphQLString)
        },
        person:{
            type:personType,
            resolve:(obj , args , ctx , info)=>{
                console.log(obj)
                return null
            }
        }
    })
})



const inputPersonType = new GraphQLInputObjectType({
    name:'PersonInput',
    fields:{
        id:{
            type:GraphQLInt
        },
        name:{
            type:new GraphQLNonNull(GraphQLString)
        },
        address:{
            type:new GraphQLNonNull(GraphQLString)
        }
    }
})

const inputCarType = new GraphQLInputObjectType({
    name:'CarInput',
    fields:{
        id:{
            type:new GraphQLNonNull(GraphQLString)
        },
        name:{
            type:new GraphQLNonNull(GraphQLString)
        },
    }
})

const personType = new GraphQLObjectType({
    name:'Person',
    fields: () =>({
        id:{
            type:new GraphQLNonNull(GraphQLInt)
        },
        name:{
            type:new GraphQLNonNull(GraphQLString)
        },
        address:{
            type:new GraphQLNonNull(GraphQLString)
        },
        cars: {
            type:new GraphQLList(carType),
            resolve:(obj , args , ctx , info)=>{
                console.log(obj)
                return null
            }
        }
    })
})



const queryType = new GraphQLObjectType({
    name:'Query',
    fields:{
        allCar: {
            type:new GraphQLList(carType),
            resolve:(obj,args,ctx,info)=>{
                return null
            }
        },
        allPerson: {
            type:new GraphQLList(personType),
            resolve:(obj,args,ctx,info)=>{
                return null
            }
        },
        findCarById: {
            args:{
                cId:{
                    type:new GraphQLNonNull(GraphQLString)
                }
            },
            type:carType,
            resolve:(obj,args,ctx,info)=>{
                return null
            }
        },
        findPersonById: {
            args:{
                pId: {
                    type:new GraphQLNonNull(GraphQLInt)
                }
            },
            type:personType,
            resolve:(obj,args,ctx,info)=>{
                return null
            }
        }
    }
})
const mutationType = new GraphQLObjectType({
    name:'Mutation',
    fields:{
        newPerson: {
            args:{
                personInput:{
                    type:new GraphQLNonNull(inputPersonType)
                }
            },
            resolve:(obj,args,ctx,info)=>{
                const {personInput} = args
                return ctx.PersonModel.create({
                    person_name:personInput.name,
                    person_address:personInput.address
                }).then(b=> true)
            },
            type:GraphQLBoolean
        },
        newCar:{
            args:{
                carInput:{
                    type:new GraphQLNonNull(inputCarType)
                }
            },
            resolve:(obj,args,ctx,info)=>{
                console.log(args)
                return false
            },
            type:GraphQLBoolean
        }
    }
})

const introspectSchemaQuery = `
    {
        __schema {
            types {
                name
                fields {
                    name
                }
            }
        }
    }
`

const myQueries = `
    mutation createNewPerson($nPerson: PersonInput!) {
        newPerson(personInput: $nPerson)
    }

    mutation createNewCar($nCar: CarInput!) {
        newCar(carInput: $nCar)
    }
`

const gSchema = new GraphQLSchema({
    query:queryType,
    mutation:mutationType,
})

sequelize
    .sync({
        force:true
    })
    .then(_=>{
        console.log('Database OK !')
        return graphql(gSchema , introspectSchemaQuery)
    })
    .then(x=>{
        console.log('after introspecting schema...')
    })
    .then(_=>{
        return graphql(gSchema , myQueries , null , {
            PersonModel
        },{
            nPerson: {
                name:'aa1',
                address:'address1'
            }
        } , 'createNewPerson')
    })
    .then(iResult=>{
        console.log(JSON.stringify(iResult))
    })
    .catch(err=>{
        console.error(err)
    })