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
        car_id:{
            type:new GraphQLNonNull(GraphQLString)
        },
        car_name:{
            type:new GraphQLNonNull(GraphQLString)
        },
        person:{
            type:personType,
            resolve:(obj , args , ctx , info)=>{
                console.log(obj.person_id)
                return ctx.PersonModel.findByPk(obj.person_id)
            }
        }
    })
})

const personType = new GraphQLObjectType({
    name:'Person',
    fields: () =>({
        person_id:{
            type:new GraphQLNonNull(GraphQLInt)
        },
        person_name:{
            type:new GraphQLNonNull(GraphQLString)
        },
        person_address:{
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


async function setPersonForCar(personId ,carId) {
    try{
        const gCar = await CarModel.findById(carId)
        const gPerson = await  PersonModel.findById(personId)
        await gCar.setPerson(gPerson)
        return true
    }catch(ex){
        return false
    }
}


const queryType = new GraphQLObjectType({
    name:'Query',
    fields:{
        allCar: {
            type:new GraphQLList(carType),
            resolve:(obj,args,ctx,info)=>{
                return ctx.CarModel.findAll()
            }
        },
        allPerson: {
            type:new GraphQLList(personType),
            resolve:(obj,args,ctx,info)=>{
                return ctx.PersonModel.findAll()
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
        addCarToPerson:{
            args:{
                personId:{
                    type:new GraphQLNonNull(GraphQLInt)
                },
                carId:{
                    type:new GraphQLNonNull(GraphQLString)
                }
            },
            resolve:(obj,args,ctx,info)=>{
                const personId = args.personId
                const carId = args.carId
                return ctx.setPersonForCar(personId , carId)
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
                const {carInput} = args
                return ctx.CarModel.create({
                    car_id:carInput.id,
                    car_name:carInput.name
                }).then(b=> true)
                .catch(err=> false)
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

    mutation setPersonForCar($pId: Int!, $cId: String!) {
        addCarToPerson(personId: $pId, carId: $cId)   
    }

    query qListCar {
        allCar {
            car_name
            person {
                person_name
                person_address
            }
        }
    }

    query qListPerson {
        allPerson {
            person_id
            person_name
            person_address
        }
    }
`

const gSchema = new GraphQLSchema({
    query:queryType,
    mutation:mutationType,
})

const testCarId = uniqid("C_")

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
        return graphql(gSchema , myQueries , null , {
            CarModel
        },{
            nCar:{
                id:testCarId,
                name:"Car1"
            }
        }, 'createNewCar')
    })
    .then(iResult=>{
        console.log(JSON.stringify(iResult))
        return graphql(gSchema,myQueries , null , {
            setPersonForCar
        },{
            pId: 1,
            cId: testCarId
        },'setPersonForCar')
    })
    .then(u=>{
        console.log(JSON.stringify(u))
        return graphql(gSchema,myQueries , null ,{
            CarModel,
            PersonModel
        },null,'qListCar')
    })
    .then(r=>{
        console.log(JSON.stringify(r))
    })
    .catch(err=>{
        console.error(err)
    })