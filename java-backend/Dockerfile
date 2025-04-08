FROM maven:3.9.5-eclipse-temurin-17 AS build

WORKDIR /app

# Copy the POM file
COPY pom.xml .

# Download all required dependencies
RUN mvn dependency:go-offline -B

# Copy the source code
COPY src ./src

# Build the application
RUN mvn package -DskipTests

# Use a smaller JRE image for the final image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Set up environment variable for database URL (can be overridden at runtime)
ENV DATABASE_URL=${DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET:default-jwt-secret-should-be-changed}
ENV CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5000}

# Command to run the Spring Boot application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
