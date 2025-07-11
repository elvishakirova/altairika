require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function (event) {
    const { httpMethod, queryStringParameters } = event;
    const postId = queryStringParameters?.postId;

    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }

    if (!postId) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: "postId is missing" }),
        };
    }

    const { data, error } = await supabase
        .from('postlikes')
        .select('*')
        .eq('postId', postId)
        .limit(1)
        .maybeSingle();

    const doc = data || null;

    switch (httpMethod) {
        case "GET":
            if (!doc) {
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Post not found" }),
                };
            }
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(doc),
            };

        case "POST":
            if (doc) {
                const { error: updateError } = await supabase
                    .from('postlikes')
                    .update({ count: doc.count + 1 })
                    .eq('postId', postId);

                if (updateError) {
                    return {
                        statusCode: 500,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: updateError.message }),
                    };
                }

                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({ updated: true }),
                };
            } else {
                const { error: insertError } = await supabase
                    .from('postlikes')
                    .insert({ postId, count: 1 });

                if (insertError) {
                    return {
                        statusCode: 500,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: insertError.message }),
                    };
                }

                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify({ created: true }),
                };
            }

        case "PUT":
            if (!doc) {
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Post not found" }),
                };
            }

            if (doc.count === 0) {
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: "Count is already 0" }),
                };
            }

            const { error: decrementError } = await supabase
                .from('postlikes')
                .update({ count: doc.count - 1 })
                .eq('postId', postId);

            if (decrementError) {
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: decrementError.message }),
                };
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ decremented: true }),
            };

        default:
            return {
                statusCode: 405,
                headers: corsHeaders,
                body: JSON.stringify({ error: "Method not allowed" }),
            };
    }
};