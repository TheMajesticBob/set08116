#version 440

// Point light information
struct point_light {
  vec4 light_colour;
  vec3 position;
  float constant;
  float linear;
  float quadratic;
};

// Spot light data
struct spot_light {
  vec4 light_colour;
  vec3 position;
  vec3 direction;
  float constant;
  float linear;
  float quadratic;
  float power;
};

// Material data
struct material {
  vec4 emissive;
  vec4 diffuse_reflection;
  vec4 specular_reflection;
  float shininess;
};

// Point lights being used in the scene
uniform point_light points[4];
// Spot lights being used in the scene
uniform spot_light spots[5];
// Material of the object being rendered
uniform material mat;
// Position of the eye (camera)
uniform vec3 eye_pos;
// Texture to sample from
uniform sampler2D tex;

// Incoming position
layout(location = 0) in vec3 position;
// Incoming normal
layout(location = 1) in vec3 normal;
// Incoming texture coordinate
layout(location = 2) in vec2 tex_coord;

// Outgoing colour
layout(location = 0) out vec4 colour;

// Point light calculation
vec4 calculate_point(in point_light point, in material mat, in vec3 position, in vec3 normal, in vec3 view_dir,
                     in vec4 tex_colour) {
  // *********************************
  // Get distance between point light and vertex
  float dist = distance(position, point.position);
  // Calculate attenuation factor
  float attentuation = 1 / (point.constant + point.linear * dist + point.quadratic * dist * dist );
  // Calculate light colour
  vec4 light_colour = point.light_colour * attentuation;
  // Calculate light dir
  vec3 light_dir = normalize( point.position - position );
  // Now use standard phong shading but using calculated light colour and direction
  // - note no ambient
  float k;
  // Calculate diffuse component
  k = max( dot( normal, light_dir ), 0 );
  vec4 diffuse = k * mat.diffuse_reflection * light_colour;
  // Calculate half vector
  vec3 half_vector = normalize( view_dir + light_dir );
  // Calculate specular component
  k = pow( max( dot( normal, half_vector ), 0 ), mat.shininess );
  vec4 specular = k * (mat.specular_reflection * light_colour );
  // Calculate primary colour component
  vec4 primary = mat.emissive + diffuse;
  // Calculate final colour - remember alpha
  primary.a = 1;
  specular.a = 1;
  vec4 colour = tex_colour * primary + specular;
  // *********************************
  return colour;
}

// Spot light calculation
vec4 calculate_spot(in spot_light spot, in material mat, in vec3 position, in vec3 normal, in vec3 view_dir,
                    in vec4 tex_colour) {
  // *********************************
  // Calculate direction to the light
  vec3 light_dir = normalize( spot.position - position );
  // Calculate distance to light
  float dist = distance(position, spot.position);
  // Calculate attenuation value
  float attentuation = 1 / (spot.constant + spot.linear * dist + spot.quadratic * dist * dist );
  // Calculate spot light intensity
  float intensity = pow( max( dot( -spot.direction, light_dir ), 0 ), spot.power );
  // Calculate light colour
  vec4 light_colour = spot.light_colour * attentuation * intensity;
  // Now use standard phong shading but using calculated light colour and direction
  // - note no ambient
  float k;
  // Calculate diffuse component
  k = max( dot( normal, light_dir ), 0 );
  vec4 diffuse = k * mat.diffuse_reflection * light_colour;
  // Calculate half vector
  vec3 half_vector = normalize( view_dir + light_dir );
  // Calculate specular component
  k = pow( max( dot( normal, half_vector ), 0 ), mat.shininess );
  vec4 specular = k * (mat.specular_reflection * light_colour );
  // Calculate primary colour component
  vec4 primary = mat.emissive + diffuse;
  // Calculate final colour - remember alpha
  primary.a = 1;
  specular.a = 1;
  vec4 colour = tex_colour * primary + specular;
  // *********************************
  return colour;
}

void main() {

  colour = vec4(0.0, 0.0, 0.0, 1.0);
  // *********************************
  // Calculate view direction
  vec3 view_dir = normalize( eye_pos - position );
  // Sample texture
  vec4 tex_sample = texture( tex, tex_coord );
  // Sum point lights

  vec4 point_lights = calculate_point(points[0], mat, position, normal, view_dir, tex_sample ) + 
					calculate_point(points[1], mat, position, normal, view_dir, tex_sample ) + 
					calculate_point(points[2], mat, position, normal, view_dir, tex_sample ) + 
					calculate_point(points[3], mat, position, normal, view_dir, tex_sample );

  // Sum spot lights

  vec4 spot_lights = calculate_spot(spots[0], mat, position, normal, view_dir, tex_sample ) + 
					calculate_spot(spots[1], mat, position, normal, view_dir, tex_sample ) + 
					calculate_spot(spots[2], mat, position, normal, view_dir, tex_sample ) + 
					calculate_spot(spots[3], mat, position, normal, view_dir, tex_sample ) + 
					calculate_spot(spots[4], mat, position, normal, view_dir, tex_sample );

  colour = point_lights + spot_lights;

  // *********************************
}