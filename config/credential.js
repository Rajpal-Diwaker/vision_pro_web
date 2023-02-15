let serverURLs = {
    "local": {
        "NODE_SERVER": "http://localhost/",
        "NODE_SERVER_PORT": "5656",
        "MYSQL_HOST": 'localhost',
        "MYSQL_USER": 'root',
        "MYSQL_PASSWORD": '123',
        'MYSQL_DATABASE': 'visionpro',
        "EMAIL_USER": 'test.techugo@gmail.com',
        "EMAIL_PASS": 'LUCKY@005',
        "EMAIL_HOST": 'smtp.gmail.com',
        "EMAIL_PORT": 465,
        "EMAIL_SECURE": true,
        "ACCESS_KEY_ID": "AKIAW7PPB7WD3RSBR5FF",
        "SECRET_ACCESS_KEY": "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",
        "REGION": "eu-west-1"
    },
    "dev": {
        "NODE_SERVER": "http://52.221.68.46/",
        "NODE_SERVER_PORT": "6262",
        "MYSQL_HOST": 'localhost',
        "MYSQL_USER": 'root',
        "MYSQL_PASSWORD": 'n%$vfh8a9zhH',
        'MYSQL_DATABASE': 'visionpro_db',
        "EMAIL_USER": 'test.techugo@gmail.com',
        "EMAIL_PASS": 'LUCKY@005',
        "EMAIL_HOST": 'smtp.gmail.com',
        "EMAIL_PORT": 465,
        "EMAIL_SECURE": true,
        "ACCESS_KEY_ID": "AKIAW7PPB7WD3RSBR5FF",
        "SECRET_ACCESS_KEY": "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",
        "REGION": "eu-west-1"
    },
    "live": {
        "NODE_SERVER": "http://13.232.62.239/",
        "NODE_SERVER_PORT": "6262",
        "MYSQL_HOST": 'localhost',
        "MYSQL_USER": 'visionpro',
        "MYSQL_PASSWORD": 'DFGo&^%65',
        'MYSQL_DATABASE': 'visionpro',
        "EMAIL_USER": 'team@metatronix.io',
        "EMAIL_PASS": '',
        "EMAIL_HOST": 'email-smtp.eu-west-1.amazonaws.com',
        "EMAIL_PORT": 465,
        "EMAIL_SECURE": true,
        "ACCESS_KEY_ID": "AKIAW7PPB7WD3RSBR5FF",
        "SECRET_ACCESS_KEY": "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",
        "REGION": "eu-west-1"
    }
}

module.exports = {
    serverURLs: serverURLs
}