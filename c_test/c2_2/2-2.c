#include<stdio.h>
//function
int fibo(int n){
    int num;
    if(n == 0)
    {
        num = 0;
    }else if(n == 1){
        num = 1;
    }else{
        num = fibo(n-1) + fibo(n-2); 
    };
    return num;
}
int main(void) {
    printf("%d\n",fibo(10));
    return 0;
}
