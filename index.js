const {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLInt,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} = require('graphql')


const Sequelize = require('sequelize')
const sequelize = new Sequelize('grapql_db','arief','arief',{
    operatorsAliases:false,
    dialect:'mysql'
})

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
    fields:{
        id:{
            type:new GraphQLNonNull(GraphQLString)
        },
        name:{
            type:new GraphQLNonNull(GraphQLString)
        },
        person:{
            type:new GraphQLObjectType(personType),
            resolve:(obj , args , ctx , info)=>{
                console.log(obj)
                return null
            }
        }
    }
})

const personType = new GraphQLObjectType({
    name:'Person',
    fields:{
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
    }
})

const queryType = new GraphQLObjectType({
    name:'Query',
    fields:{
        allCar: {
            type:new GraphQLList(carType),
            resolve:(obj,args,ctx,info)=>{

            }
        },
        allPerson: {
            type:new GraphQLList(personType),
            resolve:(obj,args,ctx,info)=>{

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
        
    }
})

const gSchema = new GraphQLSchema({
    query:queryType,
    mutation:mutationType,
})