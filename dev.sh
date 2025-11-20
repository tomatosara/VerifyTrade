#!/bin/bash

# 啟動 frontend
pnpm --filter frontend dev &

# 啟動 backend
pnpm --filter backend dev &

# 等所有背景程序結束
wait
