# Multi-stage Dockerfile para Spring Boot en Render

# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copiar archivos de configuración para aprovechar el almacenamiento en caché de capas de Docker
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B || true

# Copiar el código fuente y compilar el JAR omitiendo las pruebas unitarias
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime stage (Imagen liviana con JRE 17)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Crear usuario sin privilegios de root por seguridad
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiar el ejecutable generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Render asigna dinámicamente la variable PORT en producción (8080 por defecto local)
ENV PORT=8080
EXPOSE 8080

# Optimización de memoria JVM para contenedores en Render
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT} -jar app.jar"]
