#include <stdio.h>
#include <math.h>

void v3add(const double *a, const double *b, double *out){
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
}

void v3sub(const double *a, const double *b, double *out){
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
}

void v3mul(double c, const double *a, double *out){
  out[0] = c * a[0];
  out[1] = c * a[1];
  out[2] = c * a[2];
}

double v3len(const double *a){
  return sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
}

void v3nom(const double *a, double *out){
  double length = v3len(a);
  if (length == 0) {
    printf("error: v3nom input vector has length 0\n");
    out[0] = out[1] = out[2] = 0.0;
    return;
  }
  out[0] = a[0] / length;
  out[1] = a[1] / length;
  out[2] = a[2] / length;
}

double v3dot(const double *a, const double *b){
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

void v3crs(const double *a, const double *b, double *out){
  out[0] = a[1]*b[2] - a[2]*b[1];
  out[1] = a[2]*b[0] - a[0]*b[2];
  out[2] = a[0]*b[1] - a[1]*b[0];
}

