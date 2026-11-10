# TODO 🚧

Your new site is all yours so it doesn't matter if you break it! Try editing the code.

How to redeploy manually (from a manually created tmp folder in the Documents folder)

```js
cd

cd Documents/antizionism

npm run build

cd ../

mkdir tmp

cd tmp

cp -R /Users/scottlieber/Documents/antizionism/build/* .
touch .nojekyll         

git init
git checkout -b gh-pages
git add .
git commit -m "Manual gh-pages deploy"
git remote add origin https://github.com/antizionismresearch/antizionismresearch.github.io.git
git push -f origin gh-pages


```

Bring the wiggle style and trigger function in before the `return` statement, this time with slightly different parameters:

```js
const [style, trigger] = useWiggle({ x: 50, rotation: 1, scale: 1.2 });
```

Replace the header element to use `animated` and apply the wiggle style:

```js
<animated.h1 className="title" style={style}>
 About this site
</animated.h1>
```

Let's make the effect happen when the user hovers over the first paragraph element by replacing its opening tag:

```js
<p onMouseEnter={trigger}>
```

Hover over the paragraph to see the effect on the About page header!

## Keep going! 🚀

Try experimenting with the `useWiggle` properties for different effects!
