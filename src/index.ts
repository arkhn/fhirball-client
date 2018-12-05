import { GraphQLServer } from 'graphql-yoga'
import { importSchema } from 'graphql-import'
import { Prisma } from './generated/prisma'
import { Context } from './utils'

const checkAttribute = async (parent, args, context: Context, info) => {
    // Make sure database, resource and attribute exist
    // before returning attribute
    const databaseExists = await context.db.exists.Mapping({
        database: args.database,
    })

    if (databaseExists) {
        console.log('Database OK')

        // This query is supposed to be injective
        const resources = await context.db.query.resources({
            where: {
                name: args.resource,
                database: {
                    database: args.database,
                }
            }
        })

        console.log('Resource loaded')

        if (resources.length > 0) {
            console.log(`Resource OK (${resources.length})`)

            const attributes = await context.db.query.attributes({
                where: {
                    name: args.attribute,
                    resource: {
                        id: resources[0].id,
                    },
                }
            })

            console.log(`Attribute loaded (${attributes.length})`)

            if (attributes.length > 0) {
                console.log(`Attribute OK (${attributes.length})`)
                return attributes[0]
            } else {
                console.log('Attribute NO')
                return context.db.mutation.createAttribute({
                    data: {
                        name: args.attribute,
                        resource: {
                            connect: {
                                id: resources[0].id,
                            }
                        }
                    }
                })
            }
        } else {
            console.log('Resource NO')
            return context.db.mutation.createAttribute({
                data: {
                    name: args.attribute,
                    resource: {
                        create: {
                            name: args.resource,
                            database: {
                                connect: {
                                    database: args.database,
                                }
                            }
                        }
                    }
                }
            })
        }
    } else {
        console.log('Database NO')
        return context.db.mutation.createAttribute({
            data: {
                name: args.attribute,
                resource: {
                    create: {
                        name: args.resource,
                        database: {
                            create: {
                                database: args.database,
                            }
                        }
                    }
                }
            }
        })
    }
}

const resolvers = {
    Query: {
        mappings(parent, args, context: Context, info) {
            return context.db.query.mappings({
                where: {
                    ...args.where,
                }
            }, info)
        },
        resources(parent, args, context: Context, info) {
            return context.db.query.resources({
                where: {
                    ...args.where,
                }
            }, info)
        },
        attributes(parent, args, context: Context, info) {
            return context.db.query.attributes({
                where: {
                    ...args.where,
                }
            }, info)
        },
        inputColumns(parent, args, context: Context, info) {
            return context.db.query.inputColumns({
                where: {
                    ...args.where,
                }
            }, info)
        },
        mapping(parent, args, context: Context, info) {
            return context.db.query.mapping({
                where: {
                    ...args.where,
                }
            }, info)
        },
        resource(parent, args, context: Context, info) {
            return context.db.query.resource({
                where: {
                    ...args.where,
                }
            }, info)
        },
        attribute(parent, args, context: Context, info) {
            return context.db.query.attribute({
                where: {
                    ...args.where,
                }
            }, info)
        },
        inputColumn(parent, args, context: Context, info) {
            return context.db.query.inputColumn({
                where: {
                    ...args.where,
                }
            }, info)
        },
    },
    Mutation: {
        async checkAttribute(parent, args, context: Context, info) {
            return checkAttribute(parent, args, context, info)
        },
        updateResourcePrimaryKey(parent, args, context: Context, info) {
            return context.db.mutation.updateResource({
                data: {
                    primaryKey: args.primaryKey,
                },
                where: {
                    id: args.id,
                }
            }, info)
        },
        updateAttribute(parent, args, context: Context, info) {
            return context.db.mutation.updateAttribute({
                data: {
                    ...args.data,
                },
                where: {
                    id: args.id,
                }
            })
        },
        updateInputColumn(parent, args, context: Context, info) {
            return context.db.mutation.updateInputColumn({
                data: {
                    ...args.data,
                },
                where: {
                    id: args.id,
                }
            })
        },
        deleteInputColumn(parent, args, context: Context, info) {
            return context.db.mutation.deleteInputColumn({
                where: {
                    id: args.id,
                }
            })
        },
    },
    Subscription: {
        customAttributeSubscription: {
            subscribe: async (parent, args, context, info) => {
                const attribute = await checkAttribute(parent, args, context, info)

                return context.db.subscription.attribute({
                    where: {
                        node: {
                            id: attribute.id,
                        }
                    }
                }, info)
            },
        },
        attributeSubscription: {
            subscribe: (parent, args, context, info) => {
                return context.db.subscription.attribute({
                    where: {
                        node: {
                            id: args.id,
                        }
                    }
                }, info)
            },
        },
        inputColumnSubscription: {
            subscribe: (parent, args, context, info) => {
                return context.db.subscription.inputColumn({
                    where: {
                        node: {
                            id: args.id,
                        }
                    }
                }, info)
            },
        },
    }
}


const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers,
    context: req => ({
        ...req,
        db: new Prisma({
            endpoint: 'https://eu1.prisma.sh/public-neonswoop-398/graphql-typescript-boilerplate/dev', // the endpoint of the Prisma API
            debug: true, // log all GraphQL queries & mutations sent to the Prisma API
            // secret: 'mysecret123', // only needed if specified in `database/prisma.yml`
        }),
    }),
})

server.start(() => console.log('Server is running on http://localhost:4000'))
