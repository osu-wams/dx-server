FROM node:10.15.0-alpine

RUN apk add yarn

ENV appDir /var/www/app/current
# ENV NODE_ENV production

# Set the work directory
RUN mkdir -p /var/www/app/current
WORKDIR ${appDir}

# Add our package.json and install *before* adding our application files
ADD ./package.json ./
RUN yarn install
RUN yarn global add nodemon ts-node typescript

# Now add application files
ADD . ./

#Expose the port
EXPOSE 4000

CMD ["yarn", "prod"]
