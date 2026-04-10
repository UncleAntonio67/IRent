<script>
export default {
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
}
</script>

<style>
@import "./tailwind.generated.css";
@import "./styles/utilities.css";

page {
  background-color: #f8fafc; /* slate-50 */
  color: #0f172a; /* slate-900 */
}

button {
  margin: 0;
  padding-left: 0;
  padding-right: 0;
  line-height: 1.2;
  background: transparent;
  border: 0;
  color: inherit;
}

button::after {
  border: 0;
}

input,
textarea {
  box-sizing: border-box;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

input {
  border-radius: 12px;
}

textarea {
  border-radius: 16px;
}
</style>
