// ベクトル演算
#ifndef H_VEC3_
#define H_VEC3_

#include <math.h>

//typedef struct Vec3{    double x;    double y;    double z;}vec3;
double x(double *v){ return v[0]; }
double y(double *v){ return v[1]; }
double z(double *v){ return v[2]; }


//和
void add(double *a, double *b, double *out){    out[0]=a[0]+b[0];    out[1]=a[1]+b[1];    out[2]=a[2]+b[2];}
//差
void sub(double *a, double *b, double *out){    out[0]=a[0]-b[0];    out[1]=a[1]-b[1];    out[2]=a[2]-b[2];}
//スカラ倍
void mul(double c,double *a, double *out){     out[0]=c*a[0];  out[1]=c*a[1];    out[2]=c*a[2];}
//コピ
void cpy(double *a, double *out){    mul(1.0,a,out); }
//長さ
double len(double *a){   return sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]); }
//正規化
void   nrm(double *a, double *out){  return mul( 1.0/len(a), a, out); }
//内積
double dot(double *a,double *b){    return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
//外積
void   crs(double *a, double *b, double *out){
    out[0]= a[1]*b[2] - a[2]*b[1];
    out[1]= a[2]*b[0] - a[0]*b[2];
    out[2]= a[0]*b[1] - a[1]*b[0];
}
//画面に表示
void show_vec(double *a){    printf("%+.3f %+.3f %+.3f\n",a[0],a[1],a[2]); }
//画面に長さを表示
void show_len(double *a){    printf("%+.3f\n", len(a)); }

#endif



